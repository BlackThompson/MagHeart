# MagHeart

## TODO List

### Week 1: Nov 3 - Nov 9

#### Device @Black

- [x] Magnetic levitation
- [x] Device casing design
- [x] Simulated heartbeat Arduino code

#### Software @Dylan

- [x] Read Apple Watch heart rate stream data (a simple demo to demonstrate)
- [ ] Building Lego Figures App (A separate app / a plugin of Zoom?)

#### Other @Kacy

- [ ] Apply for GDPR

### Week 2: Nov 10 - Nov 16
#### Device @Black @ Dylan

- [ ] Add LED Strip
- [x] Connect the device and the software

### Week 3: Nov 17 - Nov 23
- [ ] User Study

### Week 4: Nov 24 - Nov 28
- [ ] TBC

---

### Notes
- Update this list daily with progress
- Check off completed items using `[x]`
- Add specific tasks as needed under each day



> [!WARNING]
> Example

> [!NOTE]
> Example

> [!TIP]
> Example

> [!IMPORTANT]
> Example

> [!CAUTION]
> Example

---

## 🔌 Arduino Device Integration

**Connect heart rate data to physical device!**

The backend can send heart rate data directly to your ESP32/Arduino device via serial port, controlling a magnetic levitation system to visualize heartbeats in real-time.

### Quick Setup

1. **Upload Arduino code**: `Device/Arduino/magheart.ino`
2. **Configure backend**: Set `ARDUINO_ENABLED=true` and `ARDUINO_PORT` in `.env`
3. **Test connection**: `python web/backend/test_arduino.py`
4. **Start backend**: Heart rates will automatically control the device!

📖 **Full guide**: [QUICKSTART_ARDUINO.md](QUICKSTART_ARDUINO.md)

---

### Software Quickstart (Backend + Frontend)

- Backend (FastAPI) in `Software/backend/` with SSE and CSV persistence.
- Frontend is a React app in `Software/frontend` (Vite + react-jss).

Run backend:

```
pip install -r Software/backend/requirements.txt
uvicorn web.backend.app:app --reload
```

Open SSE stream in browser:
- `http://127.0.0.1:8000/events?userId=demo`

Send a test heart rate:

```
curl -X POST http://127.0.0.1:8000/api/heart_rate \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo' \
  -d '{"bpm":85, "ts": 1730704523123, "source":"watch_live"}'
```

CSV files are saved under `data/{userId}.csv`.

See `Software/backend/README.md` for details.

#### React (Vite) Frontend

```
cd Software/frontend
npm install
npm run dev
```

Dev server runs on `http://127.0.0.1:5173`. The Vite proxy (see `Software/frontend/vite.config.js`) forwards `/events` and `/api` to the FastAPI backend at `http://127.0.0.1:8000`.
