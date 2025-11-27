# Local Hardware Bridge

This lightweight Python service subscribes to the cloud MagHeart backend via
Server-Sent Events and forwards every heart-rate update to a local Arduino
controller. Run it on the machine that is physically connected to your device.

## Setup

```bash
cd Device/local_bridge
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

```bash
python bridge.py \
  --user-id Haiyang \
  --backend https://magheart.uniqsea.com \
  --serial-port /dev/cu.usbserial-0001 \
  --baudrate 115200
```

- `--user-id`: the same user identifier used when uploading heart rates.
- `--backend`: cloud backend base URL (defaults to `https://magheart.uniqsea.com`).
- `--serial-port`: optional; if omitted the script only logs received BPM.
- `--baudrate`: serial baud rate (115200 by default).

Every time the cloud backend receives a heart rate for the chosen user, this
bridge immediately sends the BPM value to the connected Arduino using the same
simple line-based protocol as the original backend.
