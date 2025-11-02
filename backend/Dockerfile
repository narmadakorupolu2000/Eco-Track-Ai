FROM python:3.12-slim

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

ENV CARGO_HOME=/tmp/cargo
ENV CARGO_TARGET_DIR=/tmp/cargo_target

WORKDIR /backend

# Copy requirements file first for caching
COPY backend-requirements.txt ./

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r backend-requirements.txt

# Copy the rest of the code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]
