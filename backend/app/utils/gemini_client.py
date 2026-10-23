import os
import json
import re
import time
import hashlib
import asyncio
from typing import Dict, Any

import requests
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "").strip()
GEMINI_MODEL = "gemini-3.8-flash"


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return genai.Client(api_key=GEMINI_API_KEY)


def _extract_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    candidates = getattr(response, "candidates", None)
    if candidates:
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            if content is None:
                continue
            parts = getattr(content, "parts", None)
            if not parts:
                continue
            collected = []
            for part in parts:
                part_text = getattr(part, "text", None)
                if isinstance(part_text, str) and part_text.strip():
                    collected.append(part_text)
            if collected:
                return "\n".join(collected).strip()

    # Final fallback: string representation
    if response is not None:
        return str(response).strip()
    return ""


def upload_to_cloudinary(file_bytes: bytes, filename: str, mime: str = "image/jpeg") -> str:
    """Upload bytes to Cloudinary using signed upload and return secure URL."""
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
    client = _get_client()

    def _call_sync() -> str:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "max_output_tokens": max_output_tokens,
            },
        )
        text = _extract_text(response)
        if not text:
            raise RuntimeError("Gemini returned empty output")
        return text

    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _call_sync)
    except Exception as exc:
        raise RuntimeError(f"Gemini text generation failed: {exc}") from exc


async def classify_image(image_url: str) -> Dict[str, Any]:
    client = _get_client()

    instruction = (
        "Analyze this waste image and return ONLY valid JSON with the fields: "
        "category, confidence, disposal, tips, environmental_impact, points_earned."
    )

    def _call_sync() -> Dict[str, Any]:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                instruction,
                types.Part.from_uri(file_uri=image_url, mime_type="image/jpeg"),
            ],
            config={
                "max_output_tokens": 4096,
            },
        )

        text = _extract_text(response)
        if not text:
            raise RuntimeError("Gemini returned empty output for image classification")

        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            raise RuntimeError(f"Gemini did not return JSON: {text}")

        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Gemini returned invalid JSON: {text}") from exc

        normalized = {
            "category": parsed.get("category") or parsed.get("type") or parsed.get("classification") or "Unknown",
            "confidence": float(parsed.get("confidence") or parsed.get("score") or 0.0),
            "disposal": parsed.get("disposal") or parsed.get("recommendations") or "",
            "tips": parsed.get("tips") or [],
            "environmental_impact": parsed.get("environmental_impact") or parsed.get("impact") or "",
            "points_earned": int(parsed.get("points_earned") or parsed.get("points") or 0),
        }
        return normalized

    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _call_sync)
    except Exception as exc:
        raise RuntimeError(f"Gemini image classification failed: {exc}") from exc
