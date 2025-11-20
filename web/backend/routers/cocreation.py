from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import json
import asyncio
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.session_state: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
            self.session_state[session_id] = {}
        self.active_connections[session_id].append(websocket)
        
        # Init or update user state
        now_str = datetime.now().isoformat()
        if user_id not in self.session_state[session_id]:
            self.session_state[session_id][user_id] = {
                "userId": user_id,
                "joinedAt": now_str,
                "lastSeen": now_str,
                "status": "online",
            }
        else:
            self.session_state[session_id][user_id]["status"] = "online"
            self.session_state[session_id][user_id]["lastSeen"] = now_str

    def disconnect(self, websocket: WebSocket, session_id: str, user_id: str):
        # Remove this websocket from the active connection list
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            # Drop empty connection lists to avoid leaking empty sessions
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

        # Mentimeter-style presence: user disappears when they leave
        if session_id in self.session_state and user_id in self.session_state[session_id]:
            del self.session_state[session_id][user_id]
            # Clean up empty session state
            if not self.session_state[session_id]:
                del self.session_state[session_id]

    async def cleanup_user(self, session_id: str, user_id: str):
        """Explicitly remove a user from state if needed"""
        if session_id in self.session_state and user_id in self.session_state[session_id]:
             del self.session_state[session_id][user_id]
             if not self.session_state[session_id]:
                 del self.session_state[session_id]

    async def update_user_state(self, session_id: str, user_id: str, data: dict):
        if session_id in self.session_state and user_id in self.session_state[session_id]:
            self.session_state[session_id][user_id].update(data)
            self.session_state[session_id][user_id]["lastSeen"] = datetime.now().isoformat()
            self.session_state[session_id][user_id]["status"] = "online"
            await self.broadcast_state(session_id)

    async def broadcast_state(self, session_id: str):
        if session_id in self.active_connections and session_id in self.session_state:
            state_message = {
                "type": "state_sync",
                "payload": {
                    "participants": self.session_state[session_id],
                    "timestamp": datetime.now().isoformat()
                }
            }
            await self.broadcast(json.dumps(state_message), session_id)

    async def broadcast(self, message: str, session_id: str):
        if session_id in self.active_connections:
            # Create a copy of the list to avoid runtime errors if connections drop during iteration
            for connection in list(self.active_connections[session_id]):
                try:
                    await connection.send_text(message)
                except (RuntimeError, WebSocketDisconnect, Exception):
                    # Connection is no longer usable – remove it from the pool
                    try:
                        self.active_connections[session_id].remove(connection)
                    except ValueError:
                        # It may already have been removed by another path
                        pass

manager = ConnectionManager()

@router.websocket("/ws/{session_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, user_id: str):
    await manager.connect(websocket, session_id, user_id)
    
    # Broadcast initial state to everyone (including the new user)
    await manager.broadcast_state(session_id)
    
    join_message = {"type": "status", "payload": {"message": f"User {user_id} joined."}}
    await manager.broadcast(json.dumps(join_message), session_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Augment message with user_id
            if 'payload' not in message:
                message['payload'] = {}
            message['payload']['userId'] = user_id

            # Intercept presence updates to update server state
            if message.get("type") == "presence":
                await manager.update_user_state(session_id, user_id, message["payload"])
            else:
                await manager.broadcast(json.dumps(message), session_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id, user_id)
        await manager.broadcast_state(session_id)  # Broadcast updated participant list
        leave_message = {"type": "status", "payload": {"message": f"User {user_id} disconnected."}}
        await manager.broadcast(json.dumps(leave_message), session_id)
        
        # Optional: Schedule cleanup if user doesn't reconnect in X seconds
        # This requires background tasks which are tricky in simple websocket handlers
        # For now, we simply remove users when they disconnect (Mentimeter-style presence)
