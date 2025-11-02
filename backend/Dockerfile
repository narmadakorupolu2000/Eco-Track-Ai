# Use Python base image (3.12 recommended for pydantic-core compatibility)
FROM python:3.12-slim

# Install system dependencies (Rust for maturin, build-essential for compiling)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        git \
        libssl-dev \
        pkg-config \
        rustc \
        cargo \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for cargo to avoid read-only file system issues in cloud builds
ENV CARGO_HOME=/tmp/cargo
ENV CARGO_TARGET_DIR=/tmp/cargo_target

# Set working directory
WORKDIR /app

# Copy requirements first to cache dependencies
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r ../backend-requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port (Render will set $PORT)
EXPOSE 8000

# Start the app with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
