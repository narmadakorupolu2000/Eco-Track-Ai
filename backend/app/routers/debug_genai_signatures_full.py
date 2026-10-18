# backend/app/routers/debug_genai_signatures_full.py
from fastapi import APIRouter
from typing import Dict, Any, List
import importlib
import inspect
import traceback

router = APIRouter()

def _sig(obj) -> str:
    try:
        return str(inspect.signature(obj))
    except Exception:
        try:
            # Try __call__ if object is callable via __call__
            return str(inspect.signature(getattr(obj, "__call__", obj)))
        except Exception:
            return "<signature unavailable>"

def _members_info(mod) -> Dict[str, Any]:
    info = {}
    try:
        members = [m for m in dir(mod) if not m.startswith("_")]
        info["members_count"] = len(members)
        info["members"] = members[:500]
        callable_members = {}
        for m in members:
            try:
                attr = getattr(mod, m)
                if callable(attr):
                    callable_members[m] = {"signature": _sig(attr), "repr": repr(attr)[:1000]}
                else:
                    # if it's a module or object with callables inside, report that too
                    callable_members[m] = {"present": True, "type": type(attr).__name__}
            except Exception as e:
                callable_members[m] = {"error": str(e)}
        info["callables"] = callable_members
    except Exception as e:
        info["error"] = str(e)
        info["trace"] = traceback.format_exc().splitlines()[-1]
    return info

@router.get("/internal/debug-genai-signatures-full")
async def debug_genai_signatures_full() -> Dict[str, Any]:
    """
    Inspect google.genai module, its chats/models submodules, and the Client instance
    to produce exact callable/member signatures. Safe: does not perform network calls.
    """
    report: Dict[str, Any] = {}
    try:
        mod = importlib.import_module("google.genai")
        report["google.genai"] = {"importable": True, "repr": repr(mod)[:500]}
    except Exception as e:
        return {"error": "google.genai not importable", "exception": str(e), "trace": traceback.format_exc().splitlines()[-1]}

    # Module-level info
    report["module_members_sample"] = [m for m in dir(mod) if not m.startswith("_")][:500]

    # Inspect submodules of interest
    submods = ["chats", "models", "responses", "client", "types"]
    for name in submods:
        try:
            sub = getattr(mod, name, None)
            if sub is None:
                report[name] = {"present": False}
            else:
                report[name] = {"present": True, "repr": repr(sub)[:500], "info": _members_info(sub)}
        except Exception as e:
            report[name] = {"present": False, "error": str(e), "trace": traceback.format_exc().splitlines()[-1]}

    # Inspect Client class and an uninitialized Client instance signature
    try:
        ClientCls = getattr(mod, "Client", None)
        if ClientCls:
            report["Client"] = {"present": True, "class_repr": repr(ClientCls)[:500], "signature": _sig(ClientCls.__init__)}
            # Try constructing a client WITHOUT any network calls (pass no api_key)
            try:
                # create instance with minimal safe kwargs (no credentials)
                inst = ClientCls()
                report["Client.instance_repr"] = repr(inst)[:500]
                # inspect its attributes relevant to chats/models/responses
                for attr_name in ("chats", "models", "responses", "generate", "generate_text", "chat", "client"):
                    try:
                        attr = getattr(inst, attr_name, None)
                        if attr is None:
                            report[f"client.{attr_name}"] = {"present": False}
                        else:
                            report[f"client.{attr_name}"] = {"present": True, "repr": repr(attr)[:500]}
                            # If attr is callable or module-like, list its members and signatures
                            try:
                                report[f"client.{attr_name}"]["members"] = [m for m in dir(attr) if not m.startswith("_")][:500]
                                callables = {}
                                for m in report[f"client.{attr_name}"]["members"]:
                                    try:
                                        a = getattr(attr, m)
                                        if callable(a):
                                            callables[m] = {"signature": _sig(a), "repr": repr(a)[:1000]}
                                    except Exception as e:
                                        callables[m] = {"error": str(e)}
                                report[f"client.{attr_name}"]["callables"] = callables
                            except Exception as e:
                                report[f"client.{attr_name}"]["members_error"] = str(e)
                    except Exception as e:
                        report[f"client.{attr_name}"] = {"error": str(e)}
            except Exception as e:
                report["Client.instance_error"] = {"error": str(e), "trace": traceback.format_exc().splitlines()[-1]}
        else:
            report["Client"] = {"present": False}
    except Exception as e:
        report["Client_lookup_error"] = {"error": str(e), "trace": traceback.format_exc().splitlines()[-1]}

    return {"note": "Remove this endpoint after use", "report": report}
