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

# Lazy import of the Google GenAI SDK to avoid import-time errors if SDK isn't installed
_genai = None
def _ensure_genai():
    global _genai
    if _genai is None:
        try:
            from google import genai
            _genai = genai
        except Exception as e:
            raise RuntimeError("Gemini SDK (google.generative AI) not installed") from e
    return _genai

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
        raise HTTPException = None  # helper for linter; actual exception below
        raise RuntimeError("GEMINI_API_KEY not configured")

    # Ensure SDK is available
    genai = _ensure_genai()
    # create client
    client = genai.Client(api_key=GEMINI_API_KEY)

    # Use a lightweight, currently available Gemini model for text (choose an appropriate model)
    model = "models/gemini-1.0"  # use a stable model that supports text generation

    # Build the input; using a simple text prompt for generation
    def _call_sync():
        # Using interactions.create for flexible input
        try:
            interaction = client.interactions.create(
                model=model,
                input=prompt,
                # generation_config can be extended as needed
                generation_config={"max_output_tokens": max_output_tokens}
            )
            # The SDK response layout can vary; safely extract the assistant text
            # Prefer the last step text if using interactions
            text = None
            if hasattr(interaction, "output") and interaction.output:
                # interaction.output might be a string or object
                if isinstance(interaction.output, str):
                    text = interaction.output
                else:
                    # try canonical fields
                    if isinstance(interaction.output, dict):
                        # Some SDKs put content under 'content' or 'text'
                        if "content" in interaction.output and isinstance(interaction.output["content"], list):
                            # join text blocks
                            pieces = []
                            for block in interaction.output["content"]:
                                if isinstance(block, dict) and block.get("type") == "text":
                                    pieces.append(block.get("text", ""))
                                elif isinstance(block, str):
                                    pieces.append(block)
                            text = "\n".join(pieces).strip()
                        elif "text" in interaction.output:
                            text = interaction.output.get("text")
            # Fallback: str(interaction)
            if not text:
                text = str(interaction)
            return text
        except Exception as e:
            raise

    # Run the blocking SDK call in a thread to keep this function async
    try:
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(None, _call_sync)
        return text
    except Exception as e:
        # Do not leak API key or SDK internals
        raise RuntimeError(f"Text generation error: {e}")

async def classify_image(image_url: str) -> Dict[str, Any]:
    """
    Multimodal image classification with Gemini.
    Returns a parsed JSON-like dict with expected keys such as:
      category, confidence, disposal, tips, environmental_impact, points_earned
    The function is async and raises on failure.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai = _ensure_genai()
    client = genai.Client(api_key=GEMINI_API_KEY)

    # Model choice for multimodal tasks - pick a multimodal-capable model
    model = "models/gemini-1.0"

    # Clear instruction asking for strict JSON output
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

    # Build a multimodal input (image + instruction)
    # The final structure depends on SDK, so use interactions.create with a composite input if supported.
    def _call_sync():
        try:
            # Use interactions.create with an input that includes the image URL and the instruction
            # Note: SDK shapes can vary; the test suite will mock this function, but in real runs this may
            # need to adapt to the specific SDK version.
            interaction = client.interactions.create(
                model=model,
                input=[
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": instruction}
                ],
                generation_config={"max_output_tokens": 1024}
            )

            # Extract raw text from the result
            raw_text = ""
            if hasattr(interaction, "steps") and interaction.steps:
                last = interaction.steps[-1]
                raw_text = getattr(last, "output", "") or str(last)
            elif hasattr(interaction, "output"):
                out = interaction.output
                if isinstance(out, str):
                    raw_text = out
                elif isinstance(out, dict) and "content" in out:
                    # join text blocks if present
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

            # Try to extract a JSON object from the returned text
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

            # Normalize keys to expected shape
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
            # bubble up to caller
            raise

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, _call_sync)
        return result
    except Exception as e:
        raise RuntimeError(f"Image classification error: {e}")
