# Use Python 3.12 slim image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# Set working directory
WORKDIR /app

# Install system dependencies (gcc for any compiled deps, curl for HEALTHCHECK)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy API server requirements only (don't pollute with root requirements.txt
# which contains pytest/playwright/aiohttp - test-only deps)
COPY api-server/requirements.txt /tmp/requirements.txt

# Install Python dependencies (production only)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Render/Railway will set PORT environment variable)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run the application
CMD ["sh", "-c", "uvicorn api-server.start:app --host 0.0.0.0 --port ${PORT}"]
