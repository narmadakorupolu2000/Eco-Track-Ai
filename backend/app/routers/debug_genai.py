from fastapi import APIRouter
from typing import Dict, Any, List
import importlib
import traceback

router = APIRouter()

@router.get("/internal/debug-genai")
async def debug_genai() -> Dict[str, Any]:
    """
    Diagnostic endpoint to discover which Gemini/GenAI SDK (if any) is available
    in the running Python environment and what attributes it exposes.

    - Safe: does not instantiate clients or perform network calls.
    - Intended for short-term debugging only. Remove after use.
    """
    candidates = [
        ("google.genai", "google.genai"),
        ("genai", "genai"),
        ("google.generativeai", "google.generativeai"),
        ("google_genai", "google_genai"),
        ("google", "google"),
    ]

    report: Dict[str, Any] = {}
    for alias, name in candidates:
        entry: Dict[str, Any] = {}
        try:
            mod = importlib.import_module(name)
            entry["importable"] = True
            # Basic repr - short
            try:
                entry["repr"] = repr(mod)[:500]
            except Exception:
                entry["repr"] = "<repr-failed>"
            # Members sample (top-level, non-private)
            members = [m for m in dir(mod) if not m.startswith("_")]
            entry["members_count"] = len(members)
            entry["members_sample"] = members[:200]
            # Helpful boolean flags about expected API surface
            for attr in [
                "Client",
                "configure",
                "generate",
                "generate_text",
                "models",
                "chat",
                "interactions",
                "text",
                "create",
                "completions",
                "messages",
                "choices",
            ]:
                entry[f"has_{attr}"] = hasattr(mod, attr)
            # Try nested checks for google.genai.Client without instantiating:
            client_cls = getattr(mod, "Client", None)
            entry["Client_is_class"] = isinstance(client_cls, type)
            # Try to obtain a version string if available on module
            ver = None
            for name_try in ("__version__", "version"):
                try:
                    if hasattr(mod, name_try):
                        maybe = getattr(mod, name_try)
                        entry[f"module_{name_try}"] = str(maybe)
                        ver = str(maybe)
                        break
                except Exception:
                    pass
            # If importlib.metadata available, try to map likely package names to versions
            try:
                import importlib.metadata as _im
                possible_pkg_names = ["google-genai", "google-generative-ai", "genai", "google"]
                versions = {}
                for pkg in possible_pkg_names:
                    try:
                        versions[pkg] = _im.version(pkg)
                    except Exception:
                        versions[pkg] = None
                entry["pip_versions_candidate_names"] = versions
            except Exception:
                entry["pip_versions_candidate_names"] = "importlib.metadata not available"
        except Exception as e:
            entry["importable"] = False
            entry["error"] = str(e)
            entry["trace"] = traceback.format_exc().splitlines()[-1]
        report[alias] = entry

    # Also try to import and inspect a known small helper name 'google'
    # (if google was importable, report submodules present)
    return {
        "note": "This endpoint only introspects installed Python modules and attributes. It does not call external APIs or use GEMINI_API_KEY.",
        "report": report,
    }
