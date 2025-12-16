import os
import logging
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .telemetry_manager import telemetry_manager
from .auth import validate_stream_auth, get_current_user_ws, get_current_robot_ws
from .queue_manager import queue_manager
from .models import User, Robot

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Neufangled Control Plane")

# TODO explain what the hell this is.
# CORS is vital for the frontend to communicate with this backend from a browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC FILE SERVING ---

# Define where the static files live in the container
FRONTEND_DIST = "nf-viz/dist"

# Mount the assets folder
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=f"{FRONTEND_DIST}/assets"), name="assets")

# Serve the HTML files
@app.get("/")
async def read_index():
    return FileResponse(f"{FRONTEND_DIST}/index.html")

@app.get("/playroom")
async def read_playroom():
    return FileResponse(f"{FRONTEND_DIST}/playroom.html")

@app.get("/stringman-pilot")
async def read_playroom():
    return FileResponse(f"{FRONTEND_DIST}/stringman-pilot.html")

@app.get("/company")
async def read_playroom():
    return FileResponse(f"{FRONTEND_DIST}/company.html")

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

# --- HTTP Endpoints ---

@app.on_event("startup")
async def startup_event():
    # Initialize Redis connections in the managers
    await telemetry_manager.connect()
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
        # tell mediamtx to disconnect the client
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"status": "OK"}

# --- Robot Control Endpoint ---

@app.websocket("/telemetry/{robot_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    robot_id: str,
    token: Optional[str] = None
):
    """
    Endpoint where observer.py connects to send telemetry and receive control messages.
    
   - Register as the 'source of truth' for this robot_id.
   - Subscribe to 'commands:{robot_id}' Redis channel to forward to hardware.
    """
    await websocket.accept()
    
    try:
        # Authenticate Robot (check token against DB)
        # await get_current_robot_ws(token, robot_id)
        
        logger.info(f"Robot {robot_id} connected via WebSocket")
        await telemetry_manager.handle_robot_connection(websocket, robot_id)

    except WebSocketDisconnect:
        logger.info(f"Robot {robot_id} disconnected from server")
        await telemetry_manager.disconnect(robot_id, "robot")
        
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close(code=1011)
        raise e # raise so trace can be seen in logs

# --- User Interface for robot Endpoint ---

@app.websocket("/control/{robot_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    robot_id: str,
    token: Optional[str] = None
):
    """
    Endpoint where web based robot ui connects to send controls and receive telemetry messages.
       - Subscribe to 'state:{robot_id}' Redis channel to get updates.
       - If Playroom: Check Queue Manager. If Driver, allow writes to 'commands:{robot_id}'.
    """
    await websocket.accept()
    
    try:
        # Authenticate User
        # user = await get_current_user_ws(token)
        user_id = "temp_user_id" # Placeholder
        
        logger.info(f"User {user_id} connected to control {robot_id}")
        await telemetry_manager.handle_user_connection(websocket, robot_id, user_id)

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from {robot_id}")
        # Cleanup is handled within telemetry_manager usually, but specific disconnect logic goes here
        await telemetry_manager.disconnect(robot_id, "user")
        
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close(code=1011)
        raise e # raise so trace can be seen in logs