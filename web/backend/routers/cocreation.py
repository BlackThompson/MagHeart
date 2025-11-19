from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, message: str, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{session_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, user_id: str):
    await manager.connect(websocket, session_id)
    join_message = {"type": "status", "payload": {"message": f"User {user_id} joined."}}
    await manager.broadcast(json.dumps(join_message), session_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Augment message with user_id
            message['payload']['userId'] = user_id

            await manager.broadcast(json.dumps(message), session_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        leave_message = {"type": "status", "payload": {"message": f"User {user_id} left."}}
        await manager.broadcast(json.dumps(leave_message), session_id)