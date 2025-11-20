from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import json
import asyncio
from datetime import datetime

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # Keys are meeting IDs
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.meeting_state: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, meeting_id: str, user_id: str):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
            self.meeting_state[meeting_id] = {}
        self.active_connections[meeting_id].append(websocket)
        
        # Init or update user state
        now_str = datetime.now().isoformat()
        if user_id not in self.meeting_state[meeting_id]:
            self.meeting_state[meeting_id][user_id] = {
                "meetingId": meeting_id,
                "userId": user_id,
                "joinedAt": now_str,
                "lastSeen": now_str,
                "status": "online",
            }
        else:
            self.meeting_state[meeting_id][user_id]["status"] = "online"
            self.meeting_state[meeting_id][user_id]["lastSeen"] = now_str

    def disconnect(self, websocket: WebSocket, meeting_id: str, user_id: str):
        # Remove this websocket from the active connection list
        if meeting_id in self.active_connections:
            if websocket in self.active_connections[meeting_id]:
                self.active_connections[meeting_id].remove(websocket)
            # Drop empty connection lists to avoid leaking empty meetings
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

        # Mentimeter-style presence: user disappears when they leave
        if meeting_id in self.meeting_state and user_id in self.meeting_state[meeting_id]:
            del self.meeting_state[meeting_id][user_id]
            # Clean up empty meeting state
            if not self.meeting_state[meeting_id]:
                del self.meeting_state[meeting_id]

    async def cleanup_user(self, meeting_id: str, user_id: str):
        """Explicitly remove a user from state if needed"""
        if meeting_id in self.meeting_state and user_id in self.meeting_state[meeting_id]:
            del self.meeting_state[meeting_id][user_id]
            if not self.meeting_state[meeting_id]:
                del self.meeting_state[meeting_id]

    async def update_user_state(self, meeting_id: str, user_id: str, data: dict):
        if meeting_id in self.meeting_state and user_id in self.meeting_state[meeting_id]:
            self.meeting_state[meeting_id][user_id].update(data)
            self.meeting_state[meeting_id][user_id]["lastSeen"] = datetime.now().isoformat()
            self.meeting_state[meeting_id][user_id]["status"] = "online"
            await self.broadcast_state(meeting_id)

    async def broadcast_state(self, meeting_id: str):
        if meeting_id in self.active_connections and meeting_id in self.meeting_state:
            state_message = {
                "type": "state_sync",
                "payload": {
                    "participants": self.meeting_state[meeting_id],
                    "timestamp": datetime.now().isoformat()
                }
            }
            await self.broadcast(json.dumps(state_message), meeting_id)

    async def broadcast(self, message: str, meeting_id: str):
        if meeting_id in self.active_connections:
            # Create a copy of the list to avoid runtime errors if connections drop during iteration
            for connection in list(self.active_connections[meeting_id]):
                try:
                    await connection.send_text(message)
                except (RuntimeError, WebSocketDisconnect, Exception):
                    # Connection is no longer usable – remove it from the pool
                    try:
                        self.active_connections[meeting_id].remove(connection)
                    except ValueError:
                        # It may already have been removed by another path
                        pass

manager = ConnectionManager()

@router.websocket("/ws/{meeting_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str, user_id: str):
    await manager.connect(websocket, meeting_id, user_id)
    
    # Broadcast initial state to everyone (including the new user)
    await manager.broadcast_state(meeting_id)
    
    join_message = {
        "type": "status",
        "payload": {"message": f"User {user_id} joined meeting {meeting_id}."},
    }
    await manager.broadcast(json.dumps(join_message), meeting_id)
    
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
                await manager.update_user_state(meeting_id, user_id, message["payload"])
            else:
                await manager.broadcast(json.dumps(message), meeting_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id, user_id)
        await manager.broadcast_state(meeting_id)  # Broadcast updated participant list
        leave_message = {
            "type": "status",
            "payload": {"message": f"User {user_id} disconnected from meeting {meeting_id}."},
        }
        await manager.broadcast(json.dumps(leave_message), meeting_id)
        
        # Optional: Schedule cleanup if user doesn't reconnect in X seconds
        # This requires background tasks which are tricky in simple websocket handlers
        # For now, we simply remove users when they disconnect (Mentimeter-style presence)
