import argparse
import json
import logging
import sys
import time
from typing import Optional

import requests
import serial


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("local_bridge")


class ArduinoBridge:
    def __init__(self, port: Optional[str], baudrate: int) -> None:
        self.port_name = port
        self.baudrate = baudrate
        self.serial = None
        if port:
            self._connect()

    def _connect(self) -> None:
        if not self.port_name:
            return
        try:
            self.serial = serial.Serial(self.port_name, self.baudrate, timeout=2)
            logger.info("Connected to Arduino on %s", self.port_name)
        except Exception as exc:  # pylint: disable=broad-except
            self.serial = None
            logger.warning("Failed to connect to Arduino (%s): %s", self.port_name, exc)

    def send_bpm(self, bpm: int) -> None:
        if not self.port_name:
            logger.info("Hardware disabled. Would send BPM=%s", bpm)
            return
        if not self.serial or not self.serial.is_open:
            self._connect()
        if not self.serial:
            return
        try:
            payload = f"{bpm}\n".encode("utf-8")
            self.serial.write(payload)
            logger.info("Sent BPM=%s to Arduino", bpm)
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning("Error sending BPM to Arduino: %s", exc)
            try:
                self.serial.close()
            except Exception:  # pylint: disable=broad-except
                pass
            self.serial = None


def stream_events(sse_url: str):
    """Yield decoded JSON payloads from the SSE endpoint."""
    headers = {
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
    }
    session = requests.Session()
    while True:
        try:
            logger.info("Connecting to SSE %s", sse_url)
            with session.get(sse_url, headers=headers, stream=True, timeout=60) as resp:
                resp.raise_for_status()
                data_lines = []
                for raw_line in resp.iter_lines(decode_unicode=True):
                    if raw_line is None:
                        continue
                    if raw_line == "":
                        if data_lines:
                            payload = "\n".join(data_lines)
                            data_lines = []
                            try:
                                yield json.loads(payload)
                            except json.JSONDecodeError:
                                logger.debug("Skipping non-JSON payload: %s", payload)
                        continue
                    if raw_line.startswith(":"):
                        continue  # Comment / keepalive
                    if raw_line.startswith("data:"):
                        data_lines.append(raw_line[5:].strip())
        except requests.RequestException as exc:
            logger.warning("SSE connection error: %s", exc)
        logger.info("Reconnecting to SSE in 5 seconds...")
        time.sleep(5)


def main():
    parser = argparse.ArgumentParser(description="Local hardware bridge for MagHeart.")
    parser.add_argument("--backend", default="https://magheart.uniqsea.com", help="Base URL of the cloud backend.")
    parser.add_argument("--user-id", required=True, help="User ID to subscribe for heart rate events.")
    parser.add_argument("--serial-port", help="Arduino serial port (e.g., COM13 or /dev/cu.usbserial-0001).")
    parser.add_argument("--baudrate", type=int, default=115200, help="Serial baudrate.")
    args = parser.parse_args()

    sse_url = f"{args.backend.rstrip('/')}/events?userId={args.user_id}"
    hardware = ArduinoBridge(port=args.serial_port, baudrate=args.baudrate)

    for event in stream_events(sse_url):
        bpm = event.get("bpm")
        if bpm is None:
            continue
        try:
            bpm_int = int(bpm)
        except (TypeError, ValueError):
            logger.debug("Invalid BPM value: %s", bpm)
            continue
        logger.info("[%s] received BPM=%s", args.user_id, bpm_int)
        hardware.send_bpm(bpm_int)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Bridge stopped by user.")
        sys.exit(0)
