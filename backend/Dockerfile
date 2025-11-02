# Backend Dockerfile for FastAPI (Uvicorn)
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir uvicorn

# Copy backend code
COPY backend /app/backend

# Environment
ENV PYTHONPATH=/app/backend

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
