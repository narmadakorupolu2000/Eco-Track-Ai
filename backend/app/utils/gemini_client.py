# backend/app/utils/gemini_client.py
import os
import json
import re
import time
import hashlib
import requests
from typing import Optional, Dict, Any, List, Tuple
import asyncio

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "").strip()

_genai_module = None

def _import_genai_module():
    global _genai_module
    if _genai_module is not None:
        return _genai_module

    tried = []
    candidates = [
        ("google", "genai"),
        (None, "genai"),
        (None, "google.generativeai"),
        (None, "google_genai"),
        (None, "google"),
    ]
    for parent, name in candidates:
        try:
            if parent:
                parent_mod = __import__(parent, fromlist=[name])
                mod = getattr(parent_mod, name, None)
                if mod is None:
                    full = f"{parent}.{name}"
                    mod = __import__(full, fromlist=[name])
                if mod:
                    _genai_module = mod
                    return _genai_module
            else:
                mod = __import__(name)
                _genai_module = mod
                return _genai_module
        except Exception as e:
            tried.append((name, str(e)))
            continue

    msg = [
        "Gemini client SDK not found. Install the official SDK in the runtime environment.",
        "Try: pip install google-genai",
        "Or: pip install google-generative-ai",
        "Import attempts:",
    ]
    for name, err in tried:
        msg.append(f" - {name}: {err}")
    raise RuntimeError("\n".join(msg))


def upload_to_cloudinary(file_bytes: bytes, filename: str, mime: str = "image/jpeg") -> str:
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


def _extract_text_from_response(resp: Any) -> str:
    try:
        out = getattr(resp, "output", None)
        if out:
            if isinstance(out, (list, tuple)) and len(out) > 0:
                first = out[0]
                # try .content
                content = getattr(first, "content", None) or (first.get("content") if isinstance(first, dict) else None)
                if content:
                    if isinstance(content, list):
                        pieces = []
                        for block in content:
                            if isinstance(block, dict):
                                pieces.append(block.get("text") or block.get("message") or "")
                            elif isinstance(block, str):
                                pieces.append(block)
                        if pieces:
                            return "\n".join([p for p in pieces if p])
                    elif isinstance(content, str):
                        return content
                return str(first)
            elif isinstance(out, dict):
                content = out.get("content") or out.get("text") or out
                if isinstance(content, list):
                    pieces = []
                    for b in content:
                        if isinstance(b, dict):
                            pieces.append(b.get("text") or "")
                        elif isinstance(b, str):
                            pieces.append(b)
                    if pieces:
                        return "\n".join([p for p in pieces if p])
                return str(content)
    except Exception:
        pass

    for attr in ("output_text", "text", "response", "result"):
        try:
            if hasattr(resp, attr):
                val = getattr(resp, attr)
                if isinstance(val, str) and val.strip():
                    return val
                if isinstance(val, dict):
                    for k in ("content", "text"):
                        if k in val and isinstance(val[k], str) and val[k].strip():
                            return val[k]
        except Exception:
            pass

    try:
        msgs = getattr(resp, "messages", None) or getattr(resp, "choices", None)
        if msgs and isinstance(msgs, (list, tuple)):
            for m in reversed(msgs):
                if isinstance(m, dict):
                    t = m.get("content") or m.get("text") or m.get("message")
                    if isinstance(t, str) and t.strip():
                        return t
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
        if hasattr(resp, "__dict__"):
            s = json.dumps({k: (str(v) if not isinstance(v, (dict, list)) else v) for k, v in resp.__dict__.items()})
            if s and s.strip():
                return s
    except Exception:
        pass

    try:
        s = str(resp)
        if s and s.strip():
            return s
    except Exception:
        pass

    return ""


def _try_call_with_variants(func, variants: List[Dict[str, Any]]) -> Tuple[Any, List[Tuple[str, str]]]:
    """
    Attempt calling func with a list of kwargs variants. Return (result, []) on success,
    or (None, list_of_errors) on failure where each error is (variant_desc, error_str).
    """
    errors = []
    for v in variants:
        try:
            res = func(**v)
            return res, []
        except TypeError as e:
            errors.append((str(v.keys()), f"TypeError: {e}"))
        except Exception as e:
            errors.append((str(v.keys()), f"{type(e).__name__}: {e}"))
    return None, errors


async def generate_text(prompt: str, max_output_tokens: int = 1024) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai = _import_genai_module()

    # Build client
    client = None
    try:
        ClientCls = getattr(genai, "Client", None)
        if ClientCls:
            try:
                client = ClientCls(api_key=GEMINI_API_KEY)
            except Exception:
                cfg = getattr(genai, "configure", None)
                if callable(cfg):
                    try:
                        cfg(api_key=GEMINI_API_KEY)
                        client = genai
                    except Exception:
                        client = genai
    except Exception:
        client = genai

    if client is None:
        client = genai

    model_name = "models/gemini-1.0"

    def _call_sync():
        attempts = []

        # 1) client.generate(...)
        try:
            gen = getattr(client, "generate", None)
            if callable(gen):
                try:
                    resp = gen(model=model_name, input=prompt, max_output_tokens=max_output_tokens)
                except TypeError:
                    resp = gen(model=model_name, prompt=prompt, max_output_tokens=max_output_tokens)
                text = _extract_text_from_response(resp)
                if text:
                    return text
        except Exception as e:
            attempts.append(("client.generate", str(e)))

        # 2) client.models.generate(...)
        try:
            models = getattr(client, "models", None)
            if models and hasattr(models, "generate"):
                try:
                    resp = models.generate(model=model_name, input=prompt, max_output_tokens=max_output_tokens)
                except TypeError:
                    resp = models.generate(model=model_name, prompt=prompt, max_output_tokens=max_output_tokens)
                text = _extract_text_from_response(resp)
                if text:
                    return text
        except Exception as e:
            attempts.append(("client.models.generate", str(e)))

        # 3) client.chats.create(...) with variants
        try:
            chats = getattr(client, "chats", None)
            if chats and hasattr(chats, "create"):
                variants = [
                    {"model": model_name, "input": prompt, "max_output_tokens": max_output_tokens},
                    {"model": model_name, "input": [{"role": "user", "content": prompt}], "max_output_tokens": max_output_tokens},
                    {"model": model_name, "input": {"messages":[{"role":"user","content":prompt}]}, "max_output_tokens": max_output_tokens},
                    {"model": model_name, "prompt": prompt, "max_output_tokens": max_output_tokens},
                    {"model": model_name, "text": prompt, "max_output_tokens": max_output_tokens},
                ]
                resp, errs = _try_call_with_variants(chats.create, variants)
                if resp is not None:
                    text = _extract_text_from_response(resp)
                    if text:
                        return text
                else:
                    for e in errs:
                        attempts.append((f"client.chats.create{e[0]}", e[1]))
        except Exception as e:
            attempts.append(("client.chats.create_outer", str(e)))

        # 4) client.responses.create(...) with variants
        try:
            responses = getattr(client, "responses", None)
            if responses and hasattr(responses, "create"):
                variants = [
                    {"model": model_name, "input": prompt, "max_output_tokens": max_output_tokens},
                    {"model": model_name, "prompt": prompt, "max_output_tokens": max_output_tokens},
                    {"model": model_name, "text": prompt, "max_output_tokens": max_output_tokens},
                ]
                resp, errs = _try_call_with_variants(responses.create, variants)
                if resp is not None:
                    text = _extract_text_from_response(resp)
                    if text:
                        return text
                else:
                    for e in errs:
                        attempts.append((f"client.responses.create{e[0]}", e[1]))
        except Exception as e:
            attempts.append(("client.responses.create_outer", str(e)))

        # 5) module-level genai.generate / genai.generate_text
        try:
            genfunc = getattr(genai, "generate", None) or getattr(genai, "generate_text", None)
            if callable(genfunc):
                try:
                    resp = genfunc(model=model_name, input=prompt, max_output_tokens=max_output_tokens)
                except TypeError:
                    resp = genfunc(model=model_name, prompt=prompt, max_output_tokens=max_output_tokens)
                text = _extract_text_from_response(resp)
                if text:
                    return text
        except Exception as e:
            attempts.append(("genai.generate", str(e)))

        # If all fail:
        msg = "None of the supported Gemini SDK call patterns worked. Attempts:\n"
        for name, err in attempts:
            msg += f" - {name}: {err}\n"
        raise RuntimeError(msg)

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, _call_sync)
        if not result:
            raise RuntimeError("Gemini returned empty text")
        return result
    except Exception as e:
        raise RuntimeError(f"Text generation error: {e}")


async def classify_image(image_url: str) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai = _import_genai_module()

    client = None
    try:
        ClientCls = getattr(genai, "Client", None)
        if ClientCls:
            try:
                client = ClientCls(api_key=GEMINI_API_KEY)
            except Exception:
                cfg = getattr(genai, "configure", None)
                if callable(cfg):
                    try:
                        cfg(api_key=GEMINI_API_KEY)
                        client = genai
                    except Exception:
                        client = genai
    except Exception:
        client = genai

    if client is None:
        client = genai

    model_name = "models/gemini-1.0"

    instruction = (
        "You are given an image URL showing a single item of waste. Analyze the image and return ONLY valid JSON (no surrounding text). "
        "Include fields: category (Plastic/Metal/Paper/Glass/Organic/E-waste/Not waste), confidence (0-100), disposal (one-line), tips (array), environmental_impact (one-line), points_earned (int)."
    )

    def _call_sync():
        attempts = []

        # A: models.generate variants
        try:
            models = getattr(client, "models", None)
            if models and hasattr(models, "generate"):
                variants = [
                    {"model": model_name, "input": [{"type":"image_url","image_url":{"url":image_url}}, {"type":"text","text":instruction}], "max_output_tokens":1024},
                    {"model": model_name, "prompt": instruction + "\nImage: " + image_url, "max_output_tokens":1024},
                    {"model": model_name, "input": instruction + "\nImage: " + image_url, "max_output_tokens":1024},
                ]
                resp, errs = _try_call_with_variants(models.generate, variants)
                if resp is not None:
                    raw = _extract_text_from_response(resp)
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
                    if not j or not isinstance(j, dict):
                        raise RuntimeError("AI returned non-JSON for image classification")
                    normalized = {
                        "category": j.get("category") or j.get("type") or "Unknown",
                        "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                        "disposal": j.get("disposal") or j.get("recommendations") or "",
                        "tips": j.get("tips") or j.get("recommendations_list") or [],
                        "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                        "points_earned": int(j.get("points_earned") or j.get("points") or 0),
                    }
                    return normalized
                else:
                    for e in errs:
                        attempts.append((f"models.generate{e[0]}", e[1]))
        except Exception as e:
            attempts.append(("models.generate_outer", str(e)))

        # B: chats.create variants
        try:
            chats = getattr(client, "chats", None)
            if chats and hasattr(chats, "create"):
                variants = [
                    {"model": model_name, "input": [{"role":"user","content": instruction}, {"type":"image_url","image_url":{"url":image_url}}], "max_output_tokens":1024},
                    {"model": model_name, "input": [{"role":"user","content": instruction + "\nImage: " + image_url}], "max_output_tokens":1024},
                    {"model": model_name, "prompt": instruction + "\nImage: " + image_url, "max_output_tokens":1024},
                    {"model": model_name, "input": instruction + "\nImage: " + image_url, "max_output_tokens":1024},
                ]
                resp, errs = _try_call_with_variants(chats.create, variants)
                if resp is not None:
                    raw = _extract_text_from_response(resp)
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
                    if not j or not isinstance(j, dict):
                        raise RuntimeError("AI returned non-JSON for image classification (chat)")
                    normalized = {
                        "category": j.get("category") or j.get("type") or "Unknown",
                        "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                        "disposal": j.get("disposal") or j.get("recommendations") or "",
                        "tips": j.get("tips") or j.get("recommendations_list") or [],
                        "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                        "points_earned": int(j.get("points_earned") or j.get("points") or 0),
                    }
                    return normalized
                else:
                    for e in errs:
                        attempts.append((f"chats.create{e[0]}", e[1]))
        except Exception as e:
            attempts.append(("chats.create_outer", str(e)))

        # C: responses.create variants
        try:
            responses = getattr(client, "responses", None)
            if responses and hasattr(responses, "create"):
                variants = [
                    {"model": model_name, "input": [{"type":"image_url","image_url":{"url":image_url}}, {"type":"text","text":instruction}], "max_output_tokens":1024},
                    {"model": model_name, "prompt": instruction + "\nImage: " + image_url, "max_output_tokens":1024},
                ]
                resp, errs = _try_call_with_variants(responses.create, variants)
                if resp is not None:
                    raw = _extract_text_from_response(resp)
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
                    if not j or not isinstance(j, dict):
                        raise RuntimeError("AI returned non-JSON for image classification (responses)")
                    normalized = {
                        "category": j.get("category") or j.get("type") or "Unknown",
                        "confidence": float(j.get("confidence") or j.get("score") or 0.0),
                        "disposal": j.get("disposal") or j.get("recommendations") or "",
                        "tips": j.get("tips") or j.get("recommendations_list") or [],
                        "environmental_impact": j.get("environmental_impact") or j.get("impact") or "",
                        "points_earned": int(j.get("points_earned") or j.get("points") or 0),
                    }
                    return normalized
                else:
                    for e in errs:
                        attempts.append((f"responses.create{e[0]}", e[1]))
        except Exception as e:
            attempts.append(("responses.create_outer", str(e)))

        # D: fallback text generation with appended image URL
        try:
            genfunc = getattr(client, "generate", None) or getattr(genai, "generate", None) or getattr(client, "generate_text", None) or getattr(genai, "generate_text", None)
            if callable(genfunc):
                prompt = instruction + "\nImage: " + image_url
                try:
                    resp = genfunc(model=model_name, input=prompt, max_output_tokens=1024)
                except TypeError:
                    resp = genfunc(model=model_name, prompt=prompt, max_output_tokens=1024)
                raw = _extract_text_from_response(resp)
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
                if not j or not isinstance(j, dict):
                    raise RuntimeError("AI returned non-JSON for image classification (fallback)")
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
            attempts.append(("fallback_text_generate", str(e)))

        msg = "None of the supported Gemini SDK call patterns worked for image classification. Attempts:\n"
        for name, err in attempts:
            msg += f" - {name}: {err}\n"
        raise RuntimeError(msg)

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, _call_sync)
        return result
    except Exception as e:
        raise RuntimeError(f"Image classification error: {e}")
