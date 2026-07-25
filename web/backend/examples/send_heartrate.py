"""
Example: Send heart rate data to MagHeart backend
This will trigger the Arduino to visualize the heartbeat
"""
import requests
import time
from datetime import datetime

# Backend URL
BASE_URL = "http://127.0.0.1:7000"

def send_heart_rate(bpm: int, user_id: str = "demo", device: str = "test_script"):
    """Send a single heart rate measurement"""
    url = f"{BASE_URL}/api/heart_rate"
    
    payload = {
        "bpm": bpm,
        "ts": int(datetime.now().timestamp() * 1000),  # Current timestamp in ms
        "device": device,
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-User-Id": user_id
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        print(f"✅ Sent BPM {bpm} → {response.json()}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending heart rate: {e}")
        return False


def simulate_heart_rate_stream(duration_seconds: int = 30, interval: float = 2.0):
    """
    Simulate a stream of heart rate data
    
    Args:
        duration_seconds: How long to run the simulation
        interval: Seconds between each heart rate reading
    """
    print(f"🚀 Starting heart rate simulation for {duration_seconds} seconds...")
    print(f"📊 Sending heart rate every {interval} seconds")
    print("=" * 60)
    
    start_time = time.time()
    reading_count = 0
    
    # Simulate varying heart rate
    base_bpm = 70
    
    while time.time() - start_time < duration_seconds:
        # Add some variation to make it realistic
        variation = (time.time() - start_time) % 20 - 10  # Oscillate ±10
        bpm = int(base_bpm + variation)
        
        send_heart_rate(bpm)
        reading_count += 1
        
        time.sleep(interval)
    
    print("=" * 60)
    print(f"✅ Simulation complete! Sent {reading_count} readings")


def test_heart_rate_range():
    """Test different heart rate values"""
    test_values = [60, 70, 80, 90, 100, 110, 80, 60]
    
    print("🧪 Testing different heart rates...")
    print("=" * 60)
    
    for bpm in test_values:
        print(f"\n💓 Testing BPM: {bpm}")
        send_heart_rate(bpm)
        time.sleep(3)  # Wait to observe the change
    
    print("\n=" * 60)
    print("✅ Test complete!")
    
    # Stop the heartbeat
    print("\n🛑 Stopping heartbeat (BPM = 0)")
    send_heart_rate(0)


def main():
    """Main menu"""
    print("=" * 60)
    print("💓 MagHeart - Heart Rate Sender")
    print("=" * 60)
    print("\nWhat would you like to do?")
    print("1. Send a single heart rate")
    print("2. Simulate heart rate stream (30 seconds)")
    print("3. Test heart rate range (60-110 BPM)")
    print("4. Stop heartbeat (send 0 BPM)")
    
    choice = input("\n👉 Enter choice (1-4): ").strip()
    
    if choice == "1":
        bpm = int(input("Enter BPM (40-200): ").strip())
        send_heart_rate(bpm)
    
    elif choice == "2":
        simulate_heart_rate_stream(duration_seconds=30, interval=2.0)
    
    elif choice == "3":
        test_heart_rate_range()
    
    elif choice == "4":
        send_heart_rate(0)
        print("✅ Heartbeat stopped")
    
    else:
        print("❌ Invalid choice")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Interrupted by user")
        print("Stopping heartbeat...")
        send_heart_rate(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
