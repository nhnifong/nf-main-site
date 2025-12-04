import os
import logging
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .socket_manager import socket_manager
from .auth import validate_stream_auth, get_current_user_ws, get_current_robot_ws
from .queue_manager import queue_manager
from .models import User, Robot

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Neufangled Control Plane")

# CORS is vital for the frontend to communicate with this backend from a browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC FILE SERVING ---

# Dynamic path resolution (Robust)
# This finds the directory where main.py lives, then looks for 'public' inside it
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app.mount("/assets", StaticFiles(directory=os.path.join(PUBLIC_DIR, "assets")), name="assets")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(PUBLIC_DIR, "index.html"))

@app.get("/company")
async def read_company():
    return FileResponse(os.path.join(PUBLIC_DIR, "company.html"))

@app.get("/playroom")
async def read_playroom():
    return FileResponse(os.path.join(PUBLIC_DIR, "playroom.html"))

@app.get("/product_detail")
async def read_product():
    return FileResponse(os.path.join(PUBLIC_DIR, "product_detail.html"))

# --- Data Models for API Requests ---

class StreamAuthRequest(BaseModel):
    """Payload sent by MediaMTX to validate a stream publisher or reader."""
    ip: str
    user: str
    password: str
    path: str
    protocol: str
    id: str
    action: str
    query: str

class DatasetUploadRequest(BaseModel):
    robot_id: str
    episode_id: str
    duration_seconds: float

# --- HTTP Endpoints ---

@app.on_event("startup")
async def startup_event():
    # Initialize Redis connections in the managers
    # await socket_manager.connect()
    # await queue_manager.connect()
    pass

@app.post("/internal/auth")
async def media_server_auth(req: StreamAuthRequest):
    """
    Webhook called by MediaMTX.
    Returns 200 OK to allow, 401/403 to deny.
    
    MediaMTX logic:
    - If action == 'publish', the Robot is trying to stream video.
      We verify the 'password' (stream key) matches the robot_id.
    - If action == 'read', a User is trying to watch via WebRTC.
      We verify the user has permission to view this robot.
    """
    is_valid = await validate_stream_auth(req)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"status": "OK"}

@app.post("/api/datasets/upload_token")
async def generate_upload_token(req: DatasetUploadRequest):
    """
    Generates a presigned S3 URL so the robot can upload a recorded episode
    directly to object storage without hammering this API server.
    """
    # Verify robot exists and is authenticated (pseudo-code)
    # Generate S3 Presigned Post
    # s3_url = s3_client.generate_presigned_post(...)
    
    # For now, return a mock
    return {
        "upload_url": "https://s3.amazonaws.com/neufangled-datasets/...",
        "fields": {"key": f"{req.robot_id}/{req.episode_id}.tar.gz"}
    }

# --- WebSocket Endpoint ---

@app.websocket("/control/{robot_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    robot_id: str,
    # We attempt to extract credentials from headers or query params
    # This logic distinguishes a Robot connection from a User connection
    client_type: str =  "user", # 'user' or 'robot' - usually passed in query param ?type=robot
    token: Optional[str] = None
):
    """
    Unified WebSocket endpoint.
    
    Logic:
    1. Accept Connection.
    2. Identify Client: Is this the PHYSICAL ROBOT or a BROWSER USER?
    3. If Robot:
       - Register as the 'source of truth' for this robot_id.
       - Subscribe to 'commands:{robot_id}' Redis channel to forward to hardware.
    4. If User:
       - Subscribe to 'state:{robot_id}' Redis channel to get updates.
       - If Playroom: Check Queue Manager. If Driver, allow writes to 'commands:{robot_id}'.
    """
    await websocket.accept()
    
    try:
        if client_type == "robot":
            # Authenticate Robot (check token against DB)
            # await get_current_robot_ws(token, robot_id)
            
            logger.info(f"Robot {robot_id} connected via WebSocket")
            await socket_manager.handle_robot_connection(websocket, robot_id)
            
        else:
            # Authenticate User
            # user = await get_current_user_ws(token)
            user_id = "temp_user_id" # Placeholder
            
            logger.info(f"User {user_id} connected to control {robot_id}")
            await socket_manager.handle_user_connection(websocket, robot_id, user_id)

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from {robot_id}")
        # Cleanup is handled within socket_manager usually, but specific disconnect logic goes here
        await socket_manager.disconnect(robot_id, client_type)
        
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        # We prefer to see the trace in logs rather than swallowing it,
        # but we must close the socket to prevent zombie connections.
        await websocket.close(code=1011)
        raise e