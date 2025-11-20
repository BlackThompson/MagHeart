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

3. Environment variables:

**Required:**
- `REDIS_URL` (e.g., `redis://localhost:6379/0`)

**Optional:**
- `MAGHEART_DATA_DIR` (default `data`)
- `CORS_ALLOW_ORIGINS` (default `*`)

**Arduino Integration (Optional):**
- `ARDUINO_ENABLED` (default `false`, set to `true` to enable)
- `ARDUINO_PORT` (e.g., `COM3` on Windows, `/dev/ttyUSB0` on Linux)
- `ARDUINO_BAUDRATE` (default `115200`)

See [ARDUINO_SETUP.md](./ARDUINO_SETUP.md) for detailed Arduino integration guide.

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
  -d '{"bpm":82, "ts": 1730704523123, "device":"watch_demo"}'
```

CSV files will be stored under `data/`, for example `data/demo.csv` with columns:
`ts,bpm,device`.

## Arduino Integration

To enable real-time heart rate visualization on physical device:

1. Set `ARDUINO_ENABLED=true` in `.env`
2. Configure `ARDUINO_PORT` (e.g., `COM3`)
3. Upload `Device/Arduino/magheart.ino` to ESP32
4. Restart backend

Heart rates posted to `/api/heart_rate` will automatically control the Arduino device.

Check connection status: `GET /api/arduino/status`

See [ARDUINO_SETUP.md](./ARDUINO_SETUP.md) for complete setup guide.

## Notes
- SSE requires reverse proxy buffering disabled if behind Nginx: `proxy_buffering off;`
- Redis is used for real-time fanout and latest value; CSV holds history for now.
- Auth is simplified: use `X-User-Id` header for user scoping during development.
- Arduino communication is optional and won't affect API functionality if disabled.
