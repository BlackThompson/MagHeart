# MagHeart Software (Backend)

FastAPI backend providing heart-rate upload and real-time Server-Sent Events (SSE).

- Upload: `POST /api/heart_rate`
- Events: `GET /events?userId=...`
- Latest cache + pub/sub: Redis
- Historical persistence: per-user CSV at `data/{userId}.csv`

## Setup

1. Python 3.10+
2. Install deps:

```
pip install -r Software/backend/requirements.txt
```

3. Environment variables (optional):

- `REDIS_URL` (default `redis://localhost:6379/0`)
- `MAGHEART_DATA_DIR` (default `data`)
- `CORS_ALLOW_ORIGINS` (default `http://localhost:3000,http://127.0.0.1:3000`)

## Run

Start dev server:

```
uvicorn Software.backend.app:app --reload
```

Open SSE in browser:
- `http://127.0.0.1:8000/events?userId=demo`

Send a test heart rate:

```
curl -X POST http://127.0.0.1:8000/api/heart_rate \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo' \
  -d '{"bpm":82, "ts": 1730704523123, "source":"watch_live", "confidence":0.93}'
```

CSV files will be stored under `data/`, for example `data/demo.csv` with columns:
`ts,bpm,source,confidence,device`.

## Notes
- SSE requires reverse proxy buffering disabled if behind Nginx: `proxy_buffering off;`
- Redis is used for real-time fanout and latest value; CSV holds history for now.
- Auth is simplified: use `X-User-Id` header for user scoping during development.
