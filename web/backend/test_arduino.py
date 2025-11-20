"""
Simple test script to verify Arduino serial connection
Run this before starting the backend to check if Arduino is accessible
"""
import serial
import time
import sys

def test_arduino_connection(port: str, baudrate: int = 115200):
    """Test connection to Arduino"""
    print(f"🔌 Attempting to connect to Arduino on {port} @ {baudrate} baud...")
    
    try:
        # Open serial connection
        ser = serial.Serial(port, baudrate, timeout=2)
        print(f"✅ Serial port opened successfully")
        
        # Wait for Arduino to initialize
        print("⏳ Waiting for Arduino to initialize (2 seconds)...")
        time.sleep(2)
        
        # Clear buffer
        if ser.in_waiting:
            initial_data = ser.read_all().decode('utf-8', errors='ignore')
            print(f"📥 Initial data from Arduino:\n{initial_data}")
        
        # Test sending heart rates
        test_values = [60, 80, 100, 75, 0]
        
        for bpm in test_values:
            print(f"\n💓 Sending BPM: {bpm}")
            ser.write(f"{bpm}\n".encode('utf-8'))
            ser.flush()
            
            # Wait and read response
            time.sleep(0.5)
            if ser.in_waiting:
                response = ser.read(ser.in_waiting).decode('utf-8', errors='ignore')
                print(f"📥 Arduino response:\n{response}")
            
            time.sleep(1)  # Wait between commands
        
        # Close connection
        ser.close()
        print("\n✅ Test completed successfully!")
        print("🎉 Your Arduino is ready to use with the backend!")
        return True
        
    except serial.SerialException as e:
        print(f"❌ Serial port error: {e}")
        print("\n💡 Troubleshooting tips:")
        print("   1. Check if the port name is correct")
        print("   2. Make sure Arduino is connected via USB")
        print("   3. Close Arduino IDE Serial Monitor if it's open")
        print("   4. Try a different USB port or cable")
        if sys.platform.startswith('linux') or sys.platform == 'darwin':
            print("   5. Check port permissions (Linux/Mac):")
            print(f"      sudo chmod 666 {port}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def list_serial_ports():
    """List available serial ports"""
    import serial.tools.list_ports
    
    ports = list(serial.tools.list_ports.comports())
    
    if not ports:
        print("❌ No serial ports found")
        return []
    
    print("\n📋 Available serial ports:")
    for i, port in enumerate(ports, 1):
        print(f"   {i}. {port.device}")
        print(f"      Description: {port.description}")
        print(f"      Hardware ID: {port.hwid}")
        print()
    
    return [p.device for p in ports]


if __name__ == "__main__":
    print("=" * 60)
    print("🧪 MagHeart Arduino Connection Test")
    print("=" * 60)
    
    # List available ports
    available_ports = list_serial_ports()
    
    if not available_ports:
        print("\n💡 Connect your Arduino/ESP32 via USB and try again")
        sys.exit(1)
    
    # Get port from command line or ask user
    if len(sys.argv) > 1:
        port = sys.argv[1]
    else:
        print("\n🎯 Which port do you want to test?")
        print("   Enter port name (e.g., COM3, /dev/ttyUSB0)")
        print(f"   or enter number 1-{len(available_ports)} from the list above:")
        
        choice = input("\n👉 Port: ").strip()
        
        # Check if user entered a number
        if choice.isdigit() and 1 <= int(choice) <= len(available_ports):
            port = available_ports[int(choice) - 1]
        else:
            port = choice
    
    # Get baudrate
    baudrate = 115200
    if len(sys.argv) > 2:
        baudrate = int(sys.argv[2])
    
    print(f"\n{'=' * 60}")
    print(f"Testing: {port} @ {baudrate} baud")
    print(f"{'=' * 60}\n")
    
    # Run test
    success = test_arduino_connection(port, baudrate)
    
    if success:
        print(f"\n{'=' * 60}")
        print("✅ Next steps:")
        print(f"{'=' * 60}")
        print("1. Add to your .env file:")
        print(f"   ARDUINO_ENABLED=true")
        print(f"   ARDUINO_PORT={port}")
        print(f"   ARDUINO_BAUDRATE={baudrate}")
        print("\n2. Start the backend:")
        print("   uvicorn app:app --reload")
        print("\n3. Send heart rate data and watch it control the Arduino!")
        sys.exit(0)
    else:
        sys.exit(1)

