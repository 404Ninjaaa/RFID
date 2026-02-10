import socket
import threading
import os
import platform
import asyncio
import websockets
import queue
import time
import subprocess
from pathlib import Path

# ----------------------------
# CONFIGURATION
# ----------------------------
TCP_HOST = '0.0.0.0'
TCP_PORT = 5050
WS_HOST = 'localhost'
WS_PORT = 8765

# Debounce Configuration
DEBOUNCE_SECONDS = 2.0
last_scan_time = {}

# Sound Configuration
BASE_DIR = Path(__file__).resolve().parent
SOUND_CONNECT = BASE_DIR / "digi-beep-qst-346094.mp3"
SOUND_TAG = BASE_DIR / "beep-329314.mp3"

# Store connected WebSocket clients
ws_clients = set()
loop = None

# ----------------------------
# SOUND SYSTEM (Thread-Safe)
# ----------------------------
sound_queue = queue.Queue()

def sound_worker():
    """
    Dedicated worker thread to process sound requests sequentially.
    This prevents spawning hundreds of threads during rapid scanning.
    """
    while True:
        try:
            sound_type = sound_queue.get()
            if sound_type is None: # Sentinel to stop
                break
            
            # Play Sound
            # Play Sound
            if platform.system() == "Darwin": # Mac
                if sound_type == "connect":
                    if SOUND_CONNECT.exists():
                        # Use subprocess.run to play sound.
                        # Since this is a worker thread, blocking until sound finishes is actually okay 
                        # to prevent overlapping "beeps" if that's the goal. 
                        # If we want them to overlap, we should use Popen and NOT wait.
                        # Let's keep it serialized (blocking) for cleaner audio feedback, but use subprocess which is safer.
                        subprocess.run(["afplay", str(SOUND_CONNECT)], check=False)
                elif sound_type == "tag":
                    if SOUND_TAG.exists():
                        subprocess.run(["afplay", str(SOUND_TAG)], check=False)
            elif platform.system() == "Windows":
                import winsound
                if sound_type == "connect":
                    winsound.Beep(1000, 200)
                elif sound_type == "tag":
                    winsound.Beep(1500, 100)
            
            # Small cooldown to prevent audio overlap/glitching if desired
            # time.sleep(0.1) 
            
            sound_queue.task_done()
        except Exception as e:
            print(f"[Sound] Error: {e}")

# Start the sound worker
threading.Thread(target=sound_worker, daemon=True, name="SoundWorker").start()

def queue_sound(sound_type):
    """Enqueues a sound request instead of running it immediately."""
    sound_queue.put(sound_type)

# ----------------------------
# WEBSOCKET SERVER
# ----------------------------
async def ws_handler(websocket):
    """Handle a WebSocket connection."""
    print(f"[WS] Client connected: {websocket.remote_address}")
    ws_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        ws_clients.remove(websocket)
        print(f"[WS] Client disconnected")

def broadcast_to_ws(message):
    """Broadcasts a message to all connected WebSocket clients."""
    if ws_clients:
        websockets.broadcast(ws_clients, message)
    else:
        print("[WS] No clients connected to receive tag.")

# ----------------------------
# TCP HARDWARE SERVER
# ----------------------------
def handle_tag_scan(rfid_code):
    """Called when the TCP server receives a complete tag."""
    global last_scan_time
    
    current_time = time.time()
    last_time = last_scan_time.get(rfid_code, 0)
    
    # Debounce Check
    if (current_time - last_time) < DEBOUNCE_SECONDS:
        print(f" >> TAG IGNORED (Debounce): {rfid_code}")
        return

    last_scan_time[rfid_code] = current_time
    print(f" >> TAG: {rfid_code}")
    
    # 1. Queue Sound (Non-blocking)
    queue_sound("tag")
    
    # 2. Broadcast to WebSocket (Thread-safe)
    if loop:
        loop.call_soon_threadsafe(broadcast_to_ws, rfid_code)

def run_tcp_server():
    """Runs the TCP Server for Hardware."""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1) 
    
    try:
        server_socket.bind((TCP_HOST, TCP_PORT))
    except PermissionError:
        print(f"Error: TCP Port {TCP_PORT} is restricted.")
        return

    server_socket.listen(1)
    print(f"[TCP] Hardware Server Listening on {TCP_HOST}:{TCP_PORT}...")

    while True:
        try:
            client_socket, addr = server_socket.accept()
            print(f"\n[+] Hardware Connected: {addr[0]}")
            
            client_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            queue_sound("connect")

            while True:
                try:
                    data = client_socket.recv(1024)
                    if not data: break
                    
                    message = data.decode('utf-8').strip()
                    if message:
                        handle_tag_scan(message)

                except ConnectionResetError:
                    break
            
            print("[-] Hardware Disconnected")
            client_socket.close()
            
        except OSError:
            break
        except Exception as e:
            print(f"[TCP] Error: {e}")

# ----------------------------
# MAIN ENTRY
# ----------------------------
async def main():
    global loop
    loop = asyncio.get_running_loop()
    
    # Start TCP Server in a separate thread so it doesn't block asyncio
    tcp_thread = threading.Thread(target=run_tcp_server, daemon=True, name="TCPServer")
    tcp_thread.start()
    
    print(f"[WS] Frontend Bridge running on ws://{WS_HOST}:{WS_PORT}")
    try:
        async with websockets.serve(ws_handler, WS_HOST, WS_PORT):
            # Keep the main thread alive/awaiting forever
            await asyncio.Future()
    except OSError as e:
         print(f"[WS] Error starting server: {e}")
         print("Is another instance running?")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Server] Shutting down...")