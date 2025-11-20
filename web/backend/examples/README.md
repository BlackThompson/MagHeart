# MagHeart Backend Examples

Example scripts to interact with the MagHeart backend and control Arduino devices.

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
```

## Examples

### 1. Send Heart Rate Data (`send_heartrate.py`)

Interactive script to send heart rate data to the backend, which will control the Arduino device.

**Usage:**

```bash
python examples/send_heartrate.py
```

**Features:**
- Send single heart rate measurement
- Simulate continuous heart rate stream (30 seconds)
- Test different heart rate ranges (60-110 BPM)
- Stop heartbeat (send 0 BPM)

**Quick test:**

```python
from examples.send_heartrate import send_heart_rate

# Send 75 BPM
send_heart_rate(75)

# Stop heartbeat
send_heart_rate(0)
```

### 2. Using curl

Send heart rate via command line:

```bash
# Send 80 BPM
curl -X POST http://127.0.0.1:8000/api/heart_rate \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo' \
  -d '{"bpm":80, "ts": '$(date +%s000)', "source":"curl_test"}'

# Stop heartbeat
curl -X POST http://127.0.0.1:8000/api/heart_rate \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo' \
  -d '{"bpm":0, "ts": '$(date +%s000)', "source":"curl_test"}'
```

### 3. Check Arduino Status

```bash
curl http://127.0.0.1:8000/api/arduino/status
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

## Integration Examples

### Apple Watch Integration

Example Swift code to send heart rate from Apple Watch:

```swift
import HealthKit

func sendHeartRate(bpm: Int) {
    let url = URL(string: "http://your-server:8000/api/heart_rate")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("user123", forHTTPHeaderField: "X-User-Id")
    
    let payload: [String: Any] = [
        "bpm": bpm,
        "ts": Int(Date().timeIntervalSince1970 * 1000),
        "source": "apple_watch",
        "confidence": 0.95
    ]
    
    request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
    
    URLSession.shared.dataTask(with: request).resume()
}
```

### JavaScript/Web Integration

```javascript
async function sendHeartRate(bpm) {
  const response = await fetch('http://127.0.0.1:8000/api/heart_rate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': 'demo'
    },
    body: JSON.stringify({
      bpm: bpm,
      ts: Date.now(),
      source: 'web_app',
      confidence: 0.95
    })
  });
  
  return await response.json();
}

// Usage
await sendHeartRate(75);
```

## Workflow

```
┌──────────────┐
│ Your App     │
│ (Python/JS/  │
│  Swift/etc)  │
└──────┬───────┘
       │ POST /api/heart_rate
       │ {"bpm": 75, "ts": ...}
       ▼
┌──────────────┐
│   FastAPI    │
│   Backend    │
└──────┬───────┘
       │ Serial: "75\n"
       ▼
┌──────────────┐
│   ESP32      │
│   Arduino    │
│ (magheart.ino)│
└──────┬───────┘
       │ PWM Control
       ▼
┌──────────────┐
│   Magnetic   │
│   Levitation │
│   Heartbeat  │
└──────────────┘
```

## Tips

1. **Testing without Arduino**: Set `ARDUINO_ENABLED=false` in `.env` to test the API without hardware

2. **Monitor logs**: Watch backend logs to see heart rate data being sent to Arduino

3. **Serial Monitor**: Open Arduino Serial Monitor (115200 baud) to see debug output from the device

4. **Rate limiting**: Don't send heart rate updates too frequently (max 1-2 per second is reasonable)

5. **Error handling**: The API will still work even if Arduino is disconnected - it gracefully handles serial errors

