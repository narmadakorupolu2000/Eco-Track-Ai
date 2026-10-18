# backend/app/utils/gemini_client.py
import os
import json
import re
import time
import hashlib
import requests
from typing import Optional, Dict, Any, List
import asyncio

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "").strip()

# Lazy import holder for possible SDK modules
_genai_module = None

def _import_genai_module():
    """
    Try common import styles for the Gemini/Google GenAI SDK.
    Returns the imported module object.
    """
    global _genai_module
    if _genai_module is not None:
        return _genai_module

    # Try a few common import names/locations
    tried = []
    candidates = [
        ("google", "genai"),        # from google import genai
        (None, "genai"),            # import genai
        (None, "google.generativeai"),  # import google.generativeai as genai
        (None, "google_genai"),     # alternative
        (None, "google"),           # fallback top-level google (inspect)
    ]
    for pkg_parent, pkg_name in candidates:
        try:
            if pkg_parent:
                # from google import genai
                m_parent = __import__(pkg_parent, fromlist=[pkg_name])
                mod = getattr(m_parent, pkg_name, None)
                if mod is None:
                    # fallback to nested import
                    full = f"{pkg_parent}.{pkg_name}"
                    mod = __import__(full, fromlist=[pkg_name])
                if mod:
                    _genai_module = mod
                    return _genai_module
            else:
                mod = __import__(pkg_name)
                _genai_module = mod
                return _genai_module
        except Exception as e:
            tried.append((pkg_name, str(e)))
            continue

    # Not found — raise helpful message
    msg_lines = [
        "Gemini client SDK not found (needed for AI generation/classification).",
        "",
        "Tried common import names and failed. Install the official SDK in the runtime environment.",
        "Common install commands to try (pick one):",
        "  pip install google-genai",
        "  pip install google-generative-ai",
        "",
        "If you're inside Docker ensure the base Python version (3.10/3.11) is compatible and",
        "that the pip install step succeeded during build.",
        "",
        "Import attempts (name, error):",
    ]
    for name, err in tried:
        msg_lines.append(f"  - {name}: {err}")
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


def _extract_text_from_interaction(interaction: Any) -> str:
    """
    Robustly extract assistant text from different possible interaction/response shapes.
    Handles:
      - interaction.steps[-1].output / .content
      - interaction.output
      - interaction.messages / interaction.choices
      - response.text / response.output_text / response.result / nested content lists
      - fallback: str(interaction)
    """
    try:
        # steps[-1].output or steps[-1].content (some SDKs)
        steps = getattr(interaction, "steps", None)
        if steps:
            last = steps[-1]
            out = getattr(last, "output", None) or getattr(last, "content", None) or last
            if out:
                if isinstance(out, str):
                    return out
                if isinstance(out, dict):
                    content = out.get("content") or out.get("text") or out
                    if isinstance(content, list):
                        pieces = []
                        for block in content:
                            if isinstance(block, dict):
                                pieces.append(block.get("text") or block.get("message") or "")
                            elif isinstance(block, str):
                                pieces.append(block)
                        return "\n".join([p for p in pieces if p])
                    if isinstance(content, str):
                        return content
                return str(out)
    except Exception:
        pass

    try:
        # interaction.output (some SDKs)
        out = getattr(interaction, "output", None)
        if out:
            if isinstance(out, str):
                return out
            if isinstance(out, dict):
                content = out.get("content") or out.get("text") or out
                if isinstance(content, list):
                    pieces = []
                    for block in content:
                        if isinstance(block, dict):
                            pieces.append(block.get("text") or "")
                        elif isinstance(block, str):
                            pieces.append(block)
                    return "\n".join([p for p in pieces if p])
                return str(content)
    except Exception:
        pass

    try:
        # interaction.messages or interaction.choices (list of dicts)
        msgs = getattr(interaction, "messages", None) or getattr(interaction, "choices", None)
        if msgs and isinstance(msgs, (list, tuple)):
            for m in reversed(msgs):
                if isinstance(m, dict):
                    # common keys
                    text = m.get("content") or m.get("text") or m.get("message")
                    if isinstance(text, str) and text.strip():
                        return text
                    content = m.get("content")
                    if isinstance(content, list):
                        pieces = []
                        for block in content:
                            if isinstance(block, dict):
                                pieces.append(block.get("text") or "")
                            elif isinstance(block, str):
                                pieces.append(block)
                        if pieces:
                            return "\n".join([p for p in pieces if p])
    except Exception:
        pass

    try:
        # direct attributes like text, output_text, response, result, etc.
        if hasattr(interaction, "text"):
            t = getattr(interaction, "text")
            if isinstance(t, str) and t.strip():
                return t
        if hasattr(interaction, "output_text"):
            t = getattr(interaction, "output_text")
            if isinstance(t, str) and t.strip():
                return t
        if hasattr(interaction, "response"):
            t = getattr(interaction, "response")
            if isinstance(t, str) and t.strip():
                return t
        if hasattr(interaction, "result"):
            r = getattr(interaction, "result")
            # result might be list or dict
            if isinstance(r, list) and r:
                first = r[0]
                if isinstance(first, dict):
                    # extract content/text
                    text = first.get("content") or first.get("text") or first.get("output")
                    if isinstance(text, str) and text.strip():
                        return text
            if isinstance(r, dict):
                text = r.get("content") or r.get("text") or r.get("output")
                if isinstance(text, str) and text.strip():
                    return text
    except Exception:
        pass

    # Fallback to string conversion
    try:
        s = str(interaction)
        if s and s.strip():
            return s
    except Exception:
        pass

    return ""


async def generate_text(prompt: str, max_output_tokens: int = 1024) -> str:
    """
    Generate text from Gemini. Async wrapper that tries several SDK call shapes.
    Returns assistant text on success; raises RuntimeError on failure.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai = _import_genai_module()

    # Try to create a client if SDK exposes a Client class
    client = None
    try:
        ClientClass = getattr(genai, "Client", None)
        if ClientClass:
            try:
                client = ClientClass(api_key=GEMINI_API_KEY)
            except Exception:
                # Some SDKs require configure on the module instead
                try:
                    configure = getattr(genai, "configure", None)
                    if callable(configure):
                        configure(api_key=GEMINI_API_KEY)
                        client = genai
                except Exception:
                    client = None
    except Exception:
        client = None

    # If client is still None, use genai module directly
    if client is None:
        client = genai

    def _call_sync():
        last_err = []

        # Pattern 1: client.interactions.create(...)
        try:
            inter = getattr(client, "interactions", None)
            if inter and hasattr(inter, "create"):
                interaction = inter.create(model="models/gemini-1.0", input=prompt, generation_config={"max_output_tokens": max_output_tokens})
                return _extract_text_from_interaction(interaction)
        except Exception as e:
            last_err.append(("client.interactions.create", str(e)))

        # Pattern 2: client.chat.completions.create(...)
        try:
            chat = getattr(client, "chat", None)
            if chat and hasattr(chat, "completions") and hasattr(chat.completions, "create"):
                interaction = chat.completions.create(model="models/gemini-1.0", messages=[{"role":"user","content":prompt}], max_tokens=max_output_tokens)
                return _extract_text_from_interaction(interaction)
        except Exception as e:
            last_err.append(("client.chat.completions.create", str(e)))

        # Pattern 3: client.models.generate(...)
        try:
            models = getattr(client, "models", None)
            if models and hasattr(models, "generate"):
                interaction = models.generate(model="models/gemini-1.0", input=prompt, max_output_tokens=max_output_tokens)
                return _extract_text_from_interaction(interaction)
        except Exception as e:
            last_err.append(("client.models.generate", str(e)))

        # Pattern 4: genai.generate or client.generate
        try:
            genai_generate = getattr(client, "generate", None) or getattr(genai, "generate", None)
            if genai_generate and callable(genai_generate):
                interaction = genai_generate(model="models/gemini-1.0", input=prompt, max_output_tokens=max_output_tokens)
                return _extract_text_from_interaction(interaction)
        except Exception as e:
            last_err.append(("genai.generate/client.generate", str(e)))

        # Pattern 5: client.text.generate(...)
        try:
            text_api = getattr(client, "text", None)
            if text_api and hasattr(text_api, "generate"):
                interaction = text_api.generate(model="models/gemini-1.0", prompt=prompt, max_tokens=max_output_tokens)
                return _extract_text_from_interaction(interaction)
        except Exception as e:
            last_err.append(("client.text.generate", str(e)))

        # Pattern 6: client.generate_text(...) or genai.generate_text(...)
        try:
            gen_text = getattr(client, "generate_text", None) or getattr(genai, "generate_text", None)
            if gen_text and callable(gen_text):
                # Some SDKs expect prompt kw name, others 'input' or 'messages'
                try:
                    interaction = gen_text(model="models/gemini-1.0", prompt=prompt, max_output_tokens=max_output_tokens)
                except TypeError:
                    # fallback to input=prompt
                    interaction = gen_text(model="models/gemini-1.0", input=prompt, max_output_tokens=max_output_tokens)
                return _extract_text_from_interaction(interaction)
        except Exception as e:
            last_err.append(("client.generate_text/genai.generate_text", str(e)))

        # Pattern 7: try a simple textual call by concatenating and using a text-based generate
        # as last resort: this may work on SDKs that only accept text prompts
        try:
            # Attempt to call a simple top-level call if present
            simple = getattr(client, "simple_generate", None) or getattr(genai, "simple_generate", None)
            if simple and callable(simple):
                interaction = simple(prompt)
                return _extract_text_from_interaction(interaction)
        except Exception as e:
            last_err.append(("simple_generate", str(e)))

        # If we reach here, none of the patterns worked
        err_msg = "None of the supported Gemini SDK call patterns were found or all failed. Attempts:\n"
        for name, err in last_err:
            err_msg += f" - {name}: {err}\n"
        raise RuntimeError(err_msg)

    try:
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(None, _call_sync)
        if not text:
            raise RuntimeError("Gemini returned empty response")
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

    genai = _import_genai_module()

    # Try client creation similar to generate_text
    client = None
    try:
        ClientClass = getattr(genai, "Client", None)
        if ClientClass:
            try:
                client = ClientClass(api_key=GEMINI_API_KEY)
            except Exception:
                try:
                    configure = getattr(genai, "configure", None)
                    if callable(configure):
                        configure(api_key=GEMINI_API_KEY)
                        client = genai
                except Exception:
                    client = None
    except Exception:
        client = None
    if client is None:
        client = genai

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
        last_err = []
        # Pattern A: interactions.create with structured image input
        try:
            inter = getattr(client, "interactions", None)
            if inter and hasattr(inter, "create"):
                interaction = inter.create(
                    model="models/gemini-1.0",
                    input=[{"type":"image_url","image_url":{"url":image_url}}, {"type":"text","text":instruction}],
                    generation_config={"max_output_tokens":1024}
                )
                raw = _extract_text_from_interaction(interaction)
                j = None
                try:
                    j = json.loads(raw)
                except Exception:
                    m = re.search(r"\{[\s\S]*\}", raw)
                    if m:
                        try:
                            j = json.loads(m.group(0))
                        except Exception:
                            j = None
                if not j:
                    raise RuntimeError("AI returned non-JSON or invalid JSON for image classification")
                normalized = {
                    "category": j.get("category") or j.get("type") or "Unknown",
                    "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                    "disposal": j.get("disposal") or j.get("recommendations") or "",
                    "tips": j.get("tips") or j.get("recommendations_list") or [],
                    "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                    "points_earned": int(j.get("points_earned") or j.get("points") or 0),
                }
                return normalized
        except Exception as e:
            last_err.append(("client.interactions.create", str(e)))

        # Pattern B: chat.completions.create with image in messages
        try:
            chat = getattr(client, "chat", None)
            if chat and hasattr(chat, "completions") and hasattr(chat.completions, "create"):
                messages = [
                    {"role":"user","content":[{"type":"text","text":instruction},{"type":"image_url","image_url":{"url":image_url}}]}
                ]
                interaction = chat.completions.create(model="models/gemini-1.0", messages=messages, max_tokens=1024)
                raw = _extract_text_from_interaction(interaction)
                j = None
                try:
                    j = json.loads(raw)
                except Exception:
                    m = re.search(r"\{[\s\S]*\}", raw)
                    if m:
                        try:
                            j = json.loads(m.group(0))
                        except Exception:
                            j = None
                if not j:
                    raise RuntimeError("AI returned non-JSON or invalid JSON for image classification")
                normalized = {
                    "category": j.get("category") or j.get("type") or "Unknown",
                    "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                    "disposal": j.get("disposal") or j.get("recommendations") or "",
                    "tips": j.get("tips") or j.get("recommendations_list") or [],
                    "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                    "points_earned": int(j.get("points_earned") or j.get("points") or 0),
                }
                return normalized
        except Exception as e:
            last_err.append(("client.chat.completions.create", str(e)))

        # Pattern C: models.generate (structured)
        try:
            models = getattr(client, "models", None)
            if models and hasattr(models, "generate"):
                interaction = models.generate(model="models/gemini-1.0", input=[{"type":"image_url","image_url":{"url":image_url}}, {"type":"text","text":instruction}], max_output_tokens=1024)
                raw = _extract_text_from_interaction(interaction)
                j = None
                try:
                    j = json.loads(raw)
                except Exception:
                    m = re.search(r"\{[\s\S]*\}", raw)
                    if m:
                        try:
                            j = json.loads(m.group(0))
                        except Exception:
                            j = None
                if not j:
                    raise RuntimeError("AI returned non-JSON or invalid JSON for image classification")
                normalized = {
                    "category": j.get("category") or j.get("type") or "Unknown",
                    "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                    "disposal": j.get("disposal") or j.get("recommendations") or "",
                    "tips": j.get("tips") or j.get("recommendations_list") or [],
                    "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                    "points_earned": int(j.get("points_earned") or j.get("points") or 0),
                }
                return normalized
        except Exception as e:
            last_err.append(("client.models.generate", str(e)))

        # Pattern D (fallback): Some SDKs do not have structured multimodal APIs; append the image URL to the text instruction
        try:
            # Try client.generate_text, genai.generate_text, or client.generate as a text-only call including the image URL
            gen_text = getattr(client, "generate_text", None) or getattr(genai, "generate_text", None) or getattr(client, "generate", None) or getattr(genai, "generate", None)
            if gen_text and callable(gen_text):
                prompt = instruction + "\nImage: " + image_url
                try:
                    interaction = gen_text(model="models/gemini-1.0", prompt=prompt, max_output_tokens=1024)
                except TypeError:
                    # Try input kw
                    interaction = gen_text(model="models/gemini-1.0", input=prompt, max_output_tokens=1024)
                raw = _extract_text_from_interaction(interaction)
                j = None
                try:
                    j = json.loads(raw)
                except Exception:
                    m = re.search(r"\{[\s\S]*\}", raw)
                    if m:
                        try:
                            j = json.loads(m.group(0))
                        except Exception:
                            j = None
                if not j:
                    raise RuntimeError("AI returned non-JSON or invalid JSON for image classification (fallback text-based)")
                normalized = {
                    "category": j.get("category") or j.get("type") or "Unknown",
                    "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                    "disposal": j.get("disposal") or j.get("recommendations") or "",
                    "tips": j.get("tips") or j.get("recommendations_list") or [],
                    "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                    "points_earned": int(j.get("points_earned") or j.get("points") or 0),
                }
                return normalized
        except Exception as e:
            last_err.append(("client.generate_text/fallback", str(e)))

        # If none worked
        err_msg = "None of the supported Gemini SDK call patterns were found or all failed. Attempts:\n"
        for name, err in last_err:
            err_msg += f" - {name}: {err}\n"
        raise RuntimeError(err_msg)

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, _call_sync)
        return result
    except Exception as e:
        raise RuntimeError(f"Image classification error: {e}")
