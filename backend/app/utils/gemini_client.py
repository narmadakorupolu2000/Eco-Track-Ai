import os
import json
import re
import time
import hashlib
import requests
from typing import Optional, Dict, Any, List
import asyncio

# Do not log or expose GEMINI_API_KEY
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "").strip()

# Lazy import helper for the Gemini SDK.
_genai = None
def _ensure_genai():
    """
    Try to locate a Google Gemini / Generative AI SDK under common package names.
    If not present, raise a RuntimeError with actionable instructions.
    """
    global _genai
    if _genai is not None:
        return _genai

    # Try a few common import styles that different SDK versions expose.
    # We prefer 'from google import genai' as used in many examples.
    try:
        # Example modern import used in many docs: from google import genai
        from google import genai  # type: ignore
        _genai = genai
        return _genai
    except Exception:
        pass

    try:
        # Fallback: some packages expose a module like google.generativeai
        import google.generativeai as genai  # type: ignore
        _genai = genai
        return _genai
    except Exception:
        pass

    # Not found — raise a helpful error for the operator
    # Provide both common pip commands (package naming varies)
    msg_lines = [
        "Gemini client SDK not found (needed for AI generation/classification).",
        "",
        "To enable Gemini features, install the official SDK in the runtime environment.",
        "Common install commands to try (pick one):",
        "  pip install google-generative-ai",
        "  pip install google-genai",
        "",
        "Notes:",
        "- Ensure your Python version is compatible with the SDK (use Python 3.10+ if possible).",
        "- If you're building inside Docker, add the chosen pip command to your Dockerfile or backend requirements.",
        "- If the package is hosted on a private index, provide --extra-index-url accordingly.",
        "",
        "After installing, restart the application.",
    ]
    raise RuntimeError("\n".join(msg_lines))


def upload_to_cloudinary(file_bytes: bytes, filename: str, mime: str = "image/jpeg") -> str:
    """Upload bytes to Cloudinary using signed upload and return secure URL.
    Expects CLOUDINARY_URL in format cloudinary://<api_key>:<api_secret>@<cloud_name>
    """
    if not CLOUDINARY_URL:
        raise RuntimeError("CLOUDINARY_URL not configured")

    import re as _re
    m = _re.match(r"^cloudinary://([^:]+):([^@]+)@(.+)$", CLOUDINARY_URL)
    if not m:
        raise RuntimeError("CLOUDINARY_URL not in expected format")
    api_key, api_secret, cloud_name = m.group(1), m.group(2), m.group(3)

    timestamp = int(time.time())
    to_sign = f"timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(to_sign.encode("utf-8")).hexdigest()

    files = {"file": (filename, file_bytes, mime)}
    data = {"api_key": api_key, "timestamp": str(timestamp), "signature": signature}

    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    resp = requests.post(url, files=files, data=data)
    if resp.status_code != 200:
        raise RuntimeError(f"Cloudinary upload failed: {resp.status_code} {resp.text}")
    j = resp.json()
    return j.get("secure_url")


async def generate_text(prompt: str, max_output_tokens: int = 1024) -> str:
    """
    Generate text from Gemini. Returns plain text.
    This function is async so tests and callers can await it and mocks can use AsyncMock.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    # Ensure SDK is available
    genai = _ensure_genai()

    # create client
    # Some SDKs expose Client as genai.Client, others may have different factory functions.
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        # If Client constructor fails, try older or alternate call styles
        try:
            client = genai
        except Exception as e:
            raise RuntimeError(f"Failed to construct Gemini client: {e}")

    # Choose a text-capable model; may need adjustment for your SDK / account
    model = "models/gemini-1.0"

    def _call_sync():
        try:
            interaction = client.interactions.create(
                model=model,
                input=prompt,
                generation_config={"max_output_tokens": max_output_tokens}
            )

            # Extract text from the response robustly
            text = None
            if hasattr(interaction, "steps") and interaction.steps:
                last = interaction.steps[-1]
                text = getattr(last, "output", None) or str(last)
            elif hasattr(interaction, "output") and interaction.output:
                out = interaction.output
                if isinstance(out, str):
                    text = out
                elif isinstance(out, dict) and "content" in out:
                    content = out.get("content")
                    if isinstance(content, list):
                        pieces = []
                        for block in content:
                            if isinstance(block, dict) and block.get("type") == "text":
                                pieces.append(block.get("text", ""))
                            elif isinstance(block, str):
                                pieces.append(block)
                        text = "\n".join(pieces).strip()
                    else:
                        text = str(content)
            if not text:
                text = str(interaction)
            return text
        except Exception as e:
            raise

    try:
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(None, _call_sync)
        return text
    except Exception as e:
        raise RuntimeError(f"Text generation error: {e}")


async def classify_image(image_url: str) -> Dict[str, Any]:
    """
    Multimodal image classification with Gemini.
    Returns a parsed JSON-like dict with keys:
      category, confidence, disposal, tips, environmental_impact, points_earned
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai = _ensure_genai()

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        client = genai  # fallback; tests often monkeypatch gemini_client.classify_image directly

    model = "models/gemini-1.0"

    instruction = (
        "You are given an image URL showing a single item of waste. Analyze the image and return ONLY valid JSON (no surrounding text). "
        "The JSON must include these fields:\n"
        "  - category: one-word category (e.g., Plastic, Metal, Paper, Glass, Organic, E-waste, Not waste)\n"
        "  - confidence: number (0-100) representing percent confidence\n"
        "  - disposal: short one-line disposal instruction (e.g., 'Rinse and recycle')\n"
        "  - tips: an array of 1-5 short tips (strings)\n"
        "  - environmental_impact: one-line note about impact\n"
        "  - points_earned: integer points to award the user\n"
        "Return ONLY a single JSON object conforming to the above. If unsure, make conservative answers. "
    )

    def _call_sync():
        try:
            interaction = client.interactions.create(
                model=model,
                input=[
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": instruction}
                ],
                generation_config={"max_output_tokens": 1024}
            )

            raw_text = ""
            if hasattr(interaction, "steps") and interaction.steps:
                last = interaction.steps[-1]
                raw_text = getattr(last, "output", "") or str(last)
            elif hasattr(interaction, "output"):
                out = interaction.output
                if isinstance(out, str):
                    raw_text = out
                elif isinstance(out, dict) and "content" in out:
                    content = out.get("content")
                    if isinstance(content, list):
                        pieces = []
                        for block in content:
                            if isinstance(block, dict) and block.get("type") == "text":
                                pieces.append(block.get("text", ""))
                            elif isinstance(block, str):
                                pieces.append(block)
                        raw_text = "\n".join(pieces).strip()
                    else:
                        raw_text = str(content)
                else:
                    raw_text = str(out)
            else:
                raw_text = str(interaction)

            j = None
            try:
                j = json.loads(raw_text)
            except Exception:
                m = re.search(r"\{[\s\S]*\}", raw_text)
                if m:
                    try:
                        j = json.loads(m.group(0))
                    except Exception:
                        j = None

            if not j or not isinstance(j, dict):
                raise RuntimeError("AI returned non-JSON or invalid JSON for image classification")

            normalized = {
                "category": j.get("category") or j.get("type") or j.get("classification") or "Unknown",
                "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                "disposal": j.get("disposal") or j.get("recommendations") or "",
                "tips": j.get("tips") or j.get("recommendations_list") or [],
                "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                "points_earned": int(j.get("points_earned") or j.get("points") or 0),
            }
            return normalized
        except Exception as e:
            raise

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, _call_sync)
        return result
    except Exception as e:
        raise RuntimeError(f"Image classification error: {e}")
