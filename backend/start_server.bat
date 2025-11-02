@echo off
REM Startup script for EcoTrack Backend with Python 3.13 MongoDB SSL workaround
cd /d "%~dp0"
set PYTHONPATH=%cd%
set OPENSSL_CONF=

REM Start uvicorn
..\. venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000
