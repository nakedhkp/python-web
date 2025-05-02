from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import Dict, List

app = FastAPI()

# 配置CORS 允许所有来源的跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 使用内存存储
class MemoryStore:
    def __init__(self):
        self.store: Dict[str, str] = {}

    def get(self, key: str) -> str:
        return self.store.get(key, "") # 键为note_id, 值为笔记内容

    def set(self, key: str, value: str) -> None:
        self.store[key] = value

# 创建内存存储实例，重启后数据会丢失
memory_store = MemoryStore()

# 存储活跃的WebSocket连接
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, note_id: str): # 连接时，将note_id和websocket连接存储在active_connections中
        await websocket.accept()
        if note_id not in self.active_connections:
            self.active_connections[note_id] = []
        self.active_connections[note_id].append(websocket)

    def disconnect(self, websocket: WebSocket, note_id: str): # 断开连接时，从active_connections中移除note_id和websocket连接
        if note_id in self.active_connections:
            self.active_connections[note_id].remove(websocket)
            if not self.active_connections[note_id]:
                del self.active_connections[note_id]

    async def broadcast(self, message: str, note_id: str): # 广播时，将消息发送给所有连接的websocket
        if note_id in self.active_connections:
            for connection in self.active_connections[note_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass

manager = ConnectionManager()

@app.websocket("/ws/{note_id}")
async def websocket_endpoint(websocket: WebSocket, note_id: str):
    await manager.connect(websocket, note_id) 
    try:
        while True: # 持续监听客户端发送的文本消息
            data = await websocket.receive_text()
            # 保存到内存存储
            memory_store.set(f"note:{note_id}", data)
            # 广播给所有连接的用户
            await manager.broadcast(data, note_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, note_id)

@app.get("/notes/{note_id}")
async def get_note(note_id: str):
    try:
        content = memory_store.get(f"note:{note_id}")
        return {"content": content}
    except Exception as e:
        print(f"获取笔记内容时出错: {str(e)}")
        return {"content": ""}

if __name__ == "__main__":
    # 使用Uvicorn运行FastAPI应用
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 