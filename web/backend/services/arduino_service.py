"""
Arduino Serial Communication Service
Manages serial connection to ESP32 for heart rate control
"""
import serial
import asyncio
import logging
from typing import Optional
from ..config import ARDUINO_PORT, ARDUINO_BAUDRATE, ARDUINO_ENABLED

logger = logging.getLogger(__name__)


class ArduinoService:
    def __init__(self):
        self.serial_port: Optional[serial.Serial] = None
        self.enabled = ARDUINO_ENABLED
        self.port = ARDUINO_PORT
        self.baudrate = ARDUINO_BAUDRATE
        self._lock = asyncio.Lock()
        
    async def connect(self):
        """Initialize serial connection to Arduino"""
        if not self.enabled:
            logger.info("🔌 Arduino communication disabled (ARDUINO_ENABLED=false)")
            return False
            
        if not self.port:
            logger.warning("⚠️  Arduino port not configured (ARDUINO_PORT not set)")
            return False
        
        try:
            # Close existing connection if any
            if self.serial_port and self.serial_port.is_open:
                self.serial_port.close()
            
            # Open new connection
            self.serial_port = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=1
            )
            
            # Wait for Arduino to initialize
            await asyncio.sleep(2)
            
            # Clear any buffered data
            if self.serial_port.in_waiting:
                self.serial_port.read_all()
            
            logger.info(f"✅ Arduino connected on {self.port} @ {self.baudrate} baud")
            return True
            
        except serial.SerialException as e:
            logger.error(f"❌ Failed to connect to Arduino on {self.port}: {e}")
            self.serial_port = None
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error connecting to Arduino: {e}")
            self.serial_port = None
            return False
    
    async def disconnect(self):
        """Close serial connection"""
        if self.serial_port and self.serial_port.is_open:
            try:
                # Send 0 to stop heartbeat before disconnecting
                await self.send_heart_rate(0)
                self.serial_port.close()
                logger.info("🔌 Arduino disconnected")
            except Exception as e:
                logger.error(f"Error disconnecting Arduino: {e}")
        self.serial_port = None
    
    def is_connected(self) -> bool:
        """Check if Arduino is connected"""
        return (
            self.enabled and 
            self.serial_port is not None and 
            self.serial_port.is_open
        )
    
    async def send_heart_rate(self, bpm: int) -> bool:
        """
        Send heart rate (BPM) to Arduino
        
        Args:
            bpm: Heart rate in beats per minute (0-200)
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.is_connected():
            if self.enabled:
                logger.debug("Arduino not connected, attempting to connect...")
                await self.connect()
                if not self.is_connected():
                    return False
            else:
                return False
        
        try:
            async with self._lock:
                # Validate BPM range
                bpm = max(0, min(200, bpm))
                
                # Send BPM followed by newline
                message = f"{bpm}\n"
                self.serial_port.write(message.encode('utf-8'))
                self.serial_port.flush()
                
                # Log the command
                logger.info(f"💓 Sent to Arduino: BPM={bpm}")
                
                # Read response (optional, non-blocking)
                await asyncio.sleep(0.05)  # Small delay for Arduino to respond
                if self.serial_port.in_waiting > 0:
                    response = self.serial_port.read(self.serial_port.in_waiting).decode('utf-8', errors='ignore')
                    if response.strip():
                        logger.debug(f"Arduino response: {response.strip()}")
                
                return True
                
        except serial.SerialException as e:
            logger.error(f"❌ Serial communication error: {e}")
            # Try to reconnect
            await self.connect()
            return False
        except Exception as e:
            logger.error(f"❌ Error sending heart rate to Arduino: {e}")
            return False
    
    async def send_command(self, command: str) -> bool:
        """
        Send raw command to Arduino
        
        Args:
            command: Command string to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.is_connected():
            return False
        
        try:
            async with self._lock:
                self.serial_port.write(f"{command}\n".encode('utf-8'))
                self.serial_port.flush()
                logger.debug(f"Sent command to Arduino: {command}")
                return True
        except Exception as e:
            logger.error(f"Error sending command to Arduino: {e}")
            return False


# Global singleton instance
_arduino_service: Optional[ArduinoService] = None


async def get_arduino_service() -> ArduinoService:
    """Get or create the global Arduino service instance"""
    global _arduino_service
    if _arduino_service is None:
        _arduino_service = ArduinoService()
        await _arduino_service.connect()
    return _arduino_service


async def send_heart_rate_to_arduino(bpm: int) -> bool:
    """
    Convenience function to send heart rate to Arduino
    
    Args:
        bpm: Heart rate in beats per minute
        
    Returns:
        True if sent successfully, False otherwise
    """
    service = await get_arduino_service()
    return await service.send_heart_rate(bpm)

