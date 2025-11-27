import argparse
import json
import logging
import sys
import threading
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
    """管理与 Arduino 的串口通信。

    我们在协议层面支持 3 个“逻辑通道”（0,1,2），
    每个通道对应 Arduino 上的一个电磁铁。
    发送格式统一为: "<channel> <bpm>\\n"
    """

    def __init__(self, port: Optional[str], baudrate: int) -> None:
        self.port_name = port
        self.baudrate = baudrate
        self.serial = None
        self._lock = threading.Lock()
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

    def send_bpm_for_channel(self, channel: int, bpm: int) -> None:
        """给某个通道（0/1/2）发送一个 BPM 值。"""
        if channel < 0 or channel > 2:
            logger.warning("Invalid channel %s (must be 0,1,2)", channel)
            return

        if not self.port_name:
            logger.info("Hardware disabled. Would send CH=%s BPM=%s", channel, bpm)
            return

        with self._lock:
            if not self.serial or not self.serial.is_open:
                self._connect()
            if not self.serial:
                return
            try:
                payload = f"{channel} {bpm}\n".encode("utf-8")
                self.serial.write(payload)
                logger.info("Sent CH=%s BPM=%s to Arduino", channel, bpm)
            except Exception as exc:  # pylint: disable=broad-except
                logger.warning("Error sending BPM to Arduino: %s", exc)
                try:
                    self.serial.close()
                except Exception:  # pylint: disable=broad-except
                    pass
                self.serial = None

    def send_bpm(self, bpm: int) -> None:
        """兼容旧逻辑：把 BPM 发到通道 0。"""
        self.send_bpm_for_channel(0, bpm)


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


def _run_user_stream(
    channel: int, backend: str, user_id: str, hardware: ArduinoBridge
) -> None:
    """订阅某个 userId 的事件，并把 BPM 发到指定通道。"""
    sse_url = f"{backend.rstrip('/')}/events?userId={user_id}"
    logger.info("Starting SSE stream for user '%s' on channel %s", user_id, channel)

    for event in stream_events(sse_url):
        bpm = event.get("bpm")
        if bpm is None:
            continue
        try:
            bpm_int = int(bpm)
        except (TypeError, ValueError):
            logger.debug("Invalid BPM value for user %s: %s", user_id, bpm)
            continue
        logger.info("[user=%s, ch=%s] received BPM=%s", user_id, channel, bpm_int)
        hardware.send_bpm_for_channel(channel, bpm_int)


def main():
    parser = argparse.ArgumentParser(description="Local hardware bridge for MagHeart.")
    parser.add_argument(
        "--backend",
        default="https://magheart.uniqsea.com",
        help="Base URL of the cloud backend.",
    )
    # 兼容旧版：单用户订阅，默认绑到通道 0
    parser.add_argument(
        "--user-id", help="(Legacy) User ID to subscribe (maps to channel 0)."
    )
    # 新版：最多 3 个用户，每个固定到一个通道
    parser.add_argument("--user0", help="User ID for channel 0 (electromagnet 0).")
    parser.add_argument("--user1", help="User ID for channel 1 (electromagnet 1).")
    parser.add_argument("--user2", help="User ID for channel 2 (electromagnet 2).")
    parser.add_argument(
        "--serial-port",
        default="COM13",
        help="Arduino serial port (default: COM13, e.g., COM13 or /dev/cu.usbserial-0001).",
    )
    parser.add_argument("--baudrate", type=int, default=115200, help="Serial baudrate.")
    args = parser.parse_args()

    # 构建 user ↔ channel 对应关系（最多 3 个）
    user_mappings = []
    if args.user0:
        user_mappings.append((0, args.user0))
    if args.user1:
        user_mappings.append((1, args.user1))
    if args.user2:
        user_mappings.append((2, args.user2))

    # 如果没指定 user0/1/2，就退回到旧的 --user-id（默认走通道 0）
    if not user_mappings and args.user_id:
        user_mappings.append((0, args.user_id))

    if not user_mappings:
        parser.error(
            "At least one of --user-id, --user0, --user1, --user2 must be provided."
        )

    hardware = ArduinoBridge(port=args.serial_port, baudrate=args.baudrate)

    # 每个用户 / 通道启动一个独立的 SSE 线程，共用一个串口连接
    threads = []
    for ch, uid in user_mappings:
        t = threading.Thread(
            target=_run_user_stream,
            args=(ch, args.backend, uid, hardware),
            daemon=True,
        )
        t.start()
        threads.append(t)

    # 主线程只是保持进程存活
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Bridge stopped by user.")
        sys.exit(0)


if __name__ == "__main__":
    main()
