# 🚀 MagHeart Arduino Integration - Quick Start Guide

Connect your heart rate data to a physical Arduino device for real-time visualization!

## 📋 Prerequisites

- ESP32/Arduino device
- USB cable
- Python 3.10+
- Redis server

## 🔧 Step-by-Step Setup

### 1️⃣ Upload Arduino Code

1. Open Arduino IDE
2. Load `Device/Arduino/magheart.ino`
3. Select ESP32 board
4. Upload to your device

### 2️⃣ Find Serial Port

**Windows (PowerShell):**
```powershell
Get-WmiObject Win32_SerialPort | Select-Object DeviceID
# Example output: COM3
```

**Linux/Mac:**
```bash
ls /dev/tty* | grep -i usb
# Example output: /dev/ttyUSB0 or /dev/cu.usbserial-*
```

### 3️⃣ Test Arduino Connection

```bash
cd web/backend
python test_arduino.py
```

Follow the interactive prompts to test your Arduino connection.

### 4️⃣ Configure Backend

Create `web/backend/.env`:

```env
# Required
REDIS_URL=redis://localhost:6379/0

# Arduino Configuration
ARDUINO_ENABLED=true
ARDUINO_PORT=COM3              # Change to your port!
ARDUINO_BAUDRATE=115200
```

### 5️⃣ Install Backend Dependencies

```bash
cd web/backend
pip install -r requirements.txt
```

### 6️⃣ Start Backend

```bash
uvicorn app:app --reload
```

**Expected output:**
```
✅ Arduino connected on COM3 @ 115200 baud
✅ Arduino device connected and ready
INFO:     Application startup complete.
```

### 7️⃣ Send Heart Rate Data

**Method 1: Python Script**
```bash
python examples/send_heartrate.py
```

**Method 2: curl**
```bash
curl -X POST http://127.0.0.1:8000/api/heart_rate \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo' \
  -d '{"bpm":75, "ts": '$(date +%s000)', "source":"test"}'
```

**Method 3: Python Code**
```python
import requests
from datetime import datetime

response = requests.post(
    'http://127.0.0.1:8000/api/heart_rate',
    headers={'X-User-Id': 'demo'},
    json={
        'bpm': 75,
        'ts': int(datetime.now().timestamp() * 1000),
        'source': 'my_app'
    }
)
print(response.json())
```

## 🎉 Success!

If everything works correctly, you should see:

1. **Backend logs:**
   ```
   INFO: 💓 Heart rate 75 BPM sent to Arduino for user demo
   INFO: 💓 Sent to Arduino: BPM=75
   ```

2. **Arduino Serial Monitor (115200 baud):**
   ```
   ✅ 心率设置为: 75 BPM
      心跳周期: 800 ms
      收缩期: 280 ms (5挡)
      舒张期: 520 ms (3挡)
   💓 跳动... | BPM: 75
   ```

3. **Physical device:** Magnetic levitation pulsing at 75 BPM!

## 🔍 Check Status

Visit: http://127.0.0.1:8000/api/arduino/status

```json
{
  "connected": true,
  "enabled": true,
  "port": "COM3",
  "baudrate": 115200
}
```

## 🐛 Troubleshooting

### Arduino Not Connected

1. **Verify port name** in `.env` matches actual port
2. **Close Arduino Serial Monitor** (only one program can use the port)
3. **Check USB cable** (must support data, not just charging)
4. **Try different USB port**
5. **Check permissions** (Linux/Mac):
   ```bash
   sudo chmod 666 /dev/ttyUSB0
   ```

### No Heart Beat Visible

1. **Check Arduino Serial Monitor** for debug output
2. **Verify BPM range** (40-200)
3. **Re-upload Arduino code**
4. **Press RESET button** on ESP32

### Backend Starts but Arduino Disabled

Check `.env` file:
- `ARDUINO_ENABLED=true` (not "True" or "TRUE")
- `ARDUINO_PORT` is set correctly
- No spaces around `=` sign

## 📚 More Information

- **Detailed Setup:** [web/backend/ARDUINO_SETUP.md](web/backend/ARDUINO_SETUP.md)
- **Examples:** [web/backend/examples/README.md](web/backend/examples/README.md)
- **Backend Docs:** [web/backend/README.md](web/backend/README.md)

## 💡 Next Steps

1. **Integrate with Apple Watch**: Send real heart rate data from your watch
2. **Build Web UI**: Create a dashboard to visualize and control heart rate
3. **Add LED Control**: Extend Arduino code to control LED strips
4. **Multiple Devices**: Support multiple Arduino devices for different users

## 🎯 Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ Data Source │  HTTP   │   FastAPI    │ Serial  │   ESP32     │
│ (Watch/App) │────────▶│   Backend    │────────▶│   Arduino   │
└─────────────┘         └──────────────┘         └─────────────┘
   Send BPM              Store + Forward             PWM Control
                         Redis + CSV                 Magnetic ❤️
```

---

Need help? Check the troubleshooting guide or open an issue! 💓

