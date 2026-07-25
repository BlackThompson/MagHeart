FROM python:3.10-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies and clean afterwards to keep the image slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY web/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source (preserve package layout under web/backend)
COPY web/backend /app/web/backend

# Default data directory inside container (can be overridden)
ENV MAGHEART_DATA_DIR=/data
RUN mkdir -p ${MAGHEART_DATA_DIR}

EXPOSE 7000

CMD ["uvicorn", "web.backend.app:app", "--host", "0.0.0.0", "--port", "7000"]
