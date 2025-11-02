import os
import hashlib
import time
import json
from typing import Optional, Tuple, List, Any

try:
    from openai import OpenAI
    PERPLEXITY_AVAILABLE = True
except Exception:
    OpenAI = None
    PERPLEXITY_AVAILABLE = False

import requests

CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "").strip()
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "").strip()

# Debug: Log the loaded API key (masked) on module import
if PERPLEXITY_API_KEY:
    masked = PERPLEXITY_API_KEY[:10] + "..." + PERPLEXITY_API_KEY[-4:] if len(PERPLEXITY_API_KEY) > 14 else "***"
    print(f"🔑 Loaded Perplexity API key: {masked}")
else:
    print("⚠️ PERPLEXITY_API_KEY not set or empty")


def upload_to_cloudinary(file_bytes: bytes, filename: str, mime: str = "image/jpeg") -> str:
    """Upload bytes to Cloudinary using signed upload and return secure URL.
    Expects CLOUDINARY_URL in format cloudinary://<api_key>:<api_secret>@<cloud_name>
    """
    if not CLOUDINARY_URL:
        raise RuntimeError("CLOUDINARY_URL not configured")

    import re
    m = re.match(r"^cloudinary://([^:]+):([^@]+)@(.+)$", CLOUDINARY_URL)
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


def classify_image_with_perplexity(image_url: str, prompt_extra: Optional[str] = None) -> Tuple[dict, str, Optional[int]]:
    """Call Perplexity chat/completion to classify an image.

    Returns (parsed_result_dict, raw_text, usage_tokens)
    The parsed_result_dict should contain keys: category, confidence, recommendations
    """

    if not PERPLEXITY_AVAILABLE or OpenAI is None:
        raise RuntimeError("Perplexity SDK not installed")

    # Build structured messages similar to the official SDK examples.
    instruction_text = (
        "Analyze this waste image and provide exactly a JSON object with the following fields:\n"
        "1. type (plastic, metal, paper, glass, organic, e-waste, etc.)\n"
        "2. item (specific item identification)\n"
        "3. recyclability (recyclable/non-recyclable/compostable)\n"
        "4. disposal (one-line disposal method)\n"
        "5. confidence (0-100 float percent)\n"
        "Return ONLY valid JSON. If the image is not waste, return {\"type\": \"Not waste\", \"confidence\": 100}."
    )
    if prompt_extra:
        instruction_text += f"\nAdditional context: {prompt_extra}"

    # Create OpenAI client pointing to Perplexity API
    client = OpenAI(
        api_key=PERPLEXITY_API_KEY or "dummy-key",
        base_url="https://api.perplexity.ai"
    )

    # Compose message as list with a text and an image_url block (per your reference)
    messages: List[dict[str, Any]] = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruction_text},
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
        }
    ]

    # Use sonar-pro model (vision-capable)
    model = "sonar-pro"

    try:
        res = client.chat.completions.create(model=model, messages=messages)

        # Try to extract the text content robustly
        raw_text = ""
        usage_tokens = None
        if hasattr(res, "choices") and len(res.choices) > 0:
            choice = res.choices[0]
            # content may be a string, an object, or a list
            if hasattr(choice, "message") and hasattr(choice.message, "content"):
                content = choice.message.content
                # If content is a list of blocks, join text blocks
                if isinstance(content, list):
                    pieces: List[str] = []
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            pieces.append(block.get("text", ""))
                        elif isinstance(block, str):
                            pieces.append(block)
                    raw_text = "\n".join(pieces).strip()
                elif isinstance(content, str):
                    raw_text = content
                else:
                    raw_text = str(content)
            elif hasattr(choice, "text"):
                raw_text = choice.text
            else:
                raw_text = str(choice)

        # usage tokens if available
        if hasattr(res, "usage") and getattr(res.usage, "total_tokens", None) is not None:
            usage_tokens = getattr(res.usage, "total_tokens")

        # Try parse JSON from raw_text
        parsed = None
        try:
            parsed = json.loads(raw_text)
        except Exception:
            # attempt to extract first JSON object
            import re

            m = re.search(r"\{[\s\S]*\}", raw_text)
            if m:
                try:
                    parsed = json.loads(m.group(0))
                except Exception:
                    parsed = None

        if not parsed:
            # fallback empty result
            return ({"type": "Unknown", "confidence": 0.0, "disposal": ""}, raw_text, usage_tokens)

        # Normalize keys to a common shape
        out = {
            "type": parsed.get("type") or parsed.get("category") or parsed.get("classification") or "Unknown",
            "item": parsed.get("item") or parsed.get("specific_item") or "",
            "recyclability": parsed.get("recyclability") or parsed.get("recyclable") or parsed.get("recyclability_status") or "",
            "disposal": parsed.get("disposal") or parsed.get("recommendations") or "",
            "confidence": float(parsed.get("confidence") or parsed.get("score") or 0.0),
        }

        return (out, raw_text, usage_tokens)

    except Exception as e:
        # Log detailed error information
        import traceback
        print(f"❌ Perplexity API Error: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        print(f"   Full traceback:\n{traceback.format_exc()}")
        # Check if it's an API error with more details
        if hasattr(e, 'response'):
            print(f"   Response status: {getattr(e.response, 'status_code', 'N/A')}")
            print(f"   Response body: {getattr(e.response, 'text', 'N/A')}")
        # propagate for caller to handle (network/SDK errors)
        raise
