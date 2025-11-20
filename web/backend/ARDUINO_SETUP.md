# Arduino Integration Setup

This guide explains how to connect the MagHeart backend to your ESP32/Arduino device for real-time heart rate visualization.

## 🔌 Hardware Connection

1. **Upload the Arduino code** to your ESP32:
   - Open `Device/Arduino/magheart.ino` in Arduino IDE
   - Select your ESP32 board and port
   - Upload the sketch

2. **Connect ESP32 to your computer**:
   - Use a USB cable to connect ESP32 to your computer
   - Note the serial port:
     - **Windows**: `COM3`, `COM4`, etc.
     - **Linux**: `/dev/ttyUSB0`, `/dev/ttyACM0`, etc.
     - **Mac**: `/dev/cu.usbserial-*`, `/dev/cu.usbmodem-*`, etc.

3. **Find your serial port**:
   
   **Windows (PowerShell):**
   ```powershell
   Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID
   ```
   
   **Linux/Mac:**
   ```bash
   ls /dev/tty* | grep -i usb
   # or
   ls /dev/cu.*
   ```
   
   **Arduino IDE:**
   - Tools → Port → Check which port shows your ESP32

## ⚙️ Backend Configuration

1. **Create `.env` file** in `web/backend/`:

```bash
# Copy from example
cp .env.example .env
```

2. **Edit `.env` and configure Arduino settings**:

```env
# Enable Arduino communication
ARDUINO_ENABLED=true

# Set your serial port (adjust based on your system)
# Windows example:
ARDUINO_PORT=COM3

# Linux example:
# ARDUINO_PORT=/dev/ttyUSB0

# Mac example:
# ARDUINO_PORT=/dev/cu.usbserial-0001

# Baudrate (must match Arduino code - default 115200)
ARDUINO_BAUDRATE=115200

# Also configure Redis (required)
REDIS_URL=redis://localhost:6379/0
```

3. **Install dependencies** (if not already done):

```bash
pip install -r requirements.txt
```

The `pyserial` library will be installed for serial communication.

## 🚀 Usage

### Start the Backend

```bash
cd web/backend
uvicorn app:app --reload
```

**Expected output:**
```
✅ Arduino connected on COM3 @ 115200 baud
✅ Arduino device connected and ready
INFO:     Application startup complete.
```

**If Arduino is not connected:**
```
⚠️  Arduino device not connected (check ARDUINO_ENABLED and ARDUINO_PORT in .env)
```

### Check Arduino Status

Open your browser and visit:
```
http://127.0.0.1:8000/api/arduino/status
```

Response:
```json
{
  "connected": true,
  "enabled": true,
  "port": "COM3",
  "baudrate": 115200
}
```

### Send Heart Rate Data

When you POST heart rate data, it will automatically be sent to Arduino:

```bash
curl -X POST http://127.0.0.1:8000/api/heart_rate \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo' \
  -d '{"bpm":75, "ts": 1730704523123, "source":"watch_live"}'
```

**Backend logs:**
```
INFO: 💓 Heart rate 75 BPM sent to Arduino for user demo
INFO: 💓 Sent to Arduino: BPM=75
```

**Arduino Serial Monitor:**
```
=================================
✅ 心率设置为: 75 BPM
   心跳周期: 800 ms
   收缩期: 280 ms (5挡)
   舒张期: 520 ms (3挡)
=================================
💓 跳动... | BPM: 75
💓 跳动... | BPM: 75
```

## 🔧 Troubleshooting

### "Arduino not connected" Error

1. **Check port name**:
   - Make sure `ARDUINO_PORT` in `.env` matches your actual port
   - Ports can change when you reconnect the device

2. **Check permissions** (Linux/Mac):
   ```bash
   # Add user to dialout group (Linux)
   sudo usermod -a -G dialout $USER
   # or
   sudo chmod 666 /dev/ttyUSB0
   
   # Mac permissions
   sudo chmod 666 /dev/cu.usbserial-*
   ```

3. **Close other programs**:
   - Arduino Serial Monitor uses the same port
   - Only ONE program can access the serial port at a time
   - Close Arduino IDE Serial Monitor before starting the backend

4. **Check USB cable**:
   - Some cables are charge-only (no data)
   - Try a different cable or USB port

### Arduino Not Responding

1. **Check baudrate**:
   - `ARDUINO_BAUDRATE` in `.env` must match Arduino code (115200)

2. **Restart ESP32**:
   - Press the RESET button on ESP32
   - Or unplug and replug USB cable

3. **Re-upload Arduino code**:
   - Make sure you uploaded `magheart.ino` correctly

### Disable Arduino (for testing)

If you want to test without Arduino connected:

```env
ARDUINO_ENABLED=false
```

The backend will work normally, but won't try to send data to Arduino.

## 📝 How It Works

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│ Apple Watch │  HTTP   │   FastAPI   │ Serial  │   ESP32      │
│   / App     │────────▶│   Backend   │────────▶│   Arduino    │
│             │         │             │         │              │
│  Send BPM   │         │ POST /api/  │  "75\n" │ PWM Control  │
│             │         │ heart_rate  │         │ → Heartbeat  │
└─────────────┘         └─────────────┘         └──────────────┘
```

1. Client (Apple Watch, web app, etc.) sends heart rate via HTTP POST
2. Backend receives the data and stores it (Redis + CSV)
3. Backend sends BPM value to Arduino via serial port
4. Arduino simulates heartbeat with magnetic levitation (5-level → 3-level PWM)

## 🎯 Testing the Full Flow

### Test 1: Manual Serial Test (Arduino IDE)

1. Open Arduino Serial Monitor (115200 baud)
2. Type heart rates and press Enter:
   - `60` → Heart beats at 60 BPM
   - `100` → Heart beats at 100 BPM
   - `0` → Stop heartbeat

### Test 2: Backend → Arduino

1. Start backend with Arduino connected
2. Send heart rate via curl (see above)
3. Watch Arduino respond in real-time

### Test 3: Full Integration

1. Start backend
2. Open frontend: `http://127.0.0.1:5173`
3. Send heart rate from UI
4. See physical heartbeat on device

## 🎉 Success!

If everything works, you should see:
- ✅ Backend logs showing "Sent to Arduino"
- ✅ Arduino Serial Monitor showing heart rate updates
- ✅ Physical magnetic device pulsing with the heartbeat rhythm

Enjoy your real-time heart visualization! 💓

