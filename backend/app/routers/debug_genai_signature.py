from fastapi import APIRouter
from typing import Dict, Any
import importlib
import inspect
import traceback

router = APIRouter()

@router.get("/internal/debug-genai-signature")
async def debug_genai_signature() -> Dict[str, Any]:
    """
    Inspect the installed google.genai SDK for callable signatures.
    Safe: does not instantiate network clients or call external APIs.
    Returns: a JSON mapping of target -> { present, signature, doc_snippet, error }.
    """
    targets = [
        ("google.genai", "module"),
        ("google.genai.Client", "Client"),
        ("google.genai.Client.__init__", "Client.__init__"),
        ("google.genai.chats.create", "chats.create"),
        ("google.genai.models.generate", "models.generate"),
        ("google.genai.responses.create", "responses.create"),
        ("google.genai.generate", "generate (module)"),
        ("google.genai.generate_text", "generate_text (module)"),
        ("google.genai.chats", "chats (object)"),
        ("google.genai.models", "models (object)"),
        ("google.genai.responses", "responses (object)"),
    ]

    report: Dict[str, Any] = {}
    try:
        mod = importlib.import_module("google.genai")
    except Exception as e:
        return {
            "error": "google.genai not importable",
            "exception": str(e),
            "trace": traceback.format_exc().splitlines()[-1],
        }

    for path, label in targets:
        entry: Dict[str, Any] = {"label": label, "present": False}
        try:
            # Resolve the attribute chain after 'google.genai'
            parts = path.split(".")[2:] if path.startswith("google.genai") else path.split(".")
            obj = mod
            for p in parts:
                if p == "google" or p == "genai":
                    continue
                obj = getattr(obj, p, None)
                if obj is None:
                    break

            if obj is None:
                entry["present"] = False
                entry["note"] = f"{path} not found"
            else:
                entry["present"] = True
                # If callable, get signature
                try:
                    if inspect.isclass(obj) or inspect.isfunction(obj) or inspect.ismethod(obj) or callable(obj):
                        try:
                            sig = str(inspect.signature(obj))
                        except (ValueError, TypeError):
                            # Inspect function object from attribute if descriptor
                            try:
                                sig = str(inspect.signature(getattr(obj, "__call__", obj)))
                            except Exception:
                                sig = "signature-unavailable"
                        entry["signature"] = sig
                    else:
                        entry["signature"] = "not-callable"
                except Exception as e:
                    entry["signature_error"] = str(e)

                # Docstring snippet
                try:
                    doc = inspect.getdoc(obj) or ""
                    entry["doc_snippet"] = doc.strip().splitlines()[0][:500] if doc else ""
                except Exception:
                    entry["doc_snippet"] = ""

                # repr for context
                try:
                    entry["repr"] = repr(obj)[:1000]
                except Exception:
                    entry["repr"] = "<repr-failed>"
        except Exception as e:
            entry["present"] = False
            entry["exception"] = str(e)
            entry["trace"] = traceback.format_exc().splitlines()[-1]

        report[path] = entry

    # Also include top-level attributes present under google.genai
    try:
        members = [m for m in dir(mod) if not m.startswith("_")]
        report["_module_members_sample"] = members[:200]
    except Exception:
        report["_module_members_sample"] = "unavailable"

    return {
        "note": "This endpoint inspects local module objects only (no network calls). Remove after debugging.",
        "report": report,
    }
