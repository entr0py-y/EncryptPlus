# Stage 1: Build the Go cryptoscan binary
FROM golang:1.22-bookworm AS go-builder
WORKDIR /app/cryptoscan
COPY cryptoscan/ .
RUN go build -o cryptoscan cmd/cryptoscan/main.go

# Stage 2: Python Backend runtime
FROM python:3.11-slim-bookworm
WORKDIR /app

# Install git (required for cloning remote repositories during scans)
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps ./apps
COPY demo_repo ./demo_repo
RUN mkdir -p /app/packages
COPY --from=go-builder /app/cryptoscan/cryptoscan ./cryptoscan/cryptoscan

ENV PYTHONPATH=/app
ENV CRYPTOSCAN_BIN=/app/cryptoscan/cryptoscan
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "uvicorn apps.api.main:app --host 0.0.0.0 --port ${PORT}"]
