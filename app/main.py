import os
import logging
from typing import Optional, Annotated

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from .telemetry_manager import telemetry_manager
from .auth import verify_google_token, validate_stream_auth, check_robot_ownership
from .queue_manager import queue_manager
from .simulation_manager import simulation_manager
from .database import init_db, get_db, RobotOwnership

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Neufangled Control Plane",
    openapi_url=None,
    docs_url=None, 
    redoc_url=None,
)

# TODO explain what the hell this is.
# CORS is vital for the frontend to communicate with this backend from a browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

token_auth_scheme = HTTPBearer()

@app.on_event("startup")
async def startup_event():
    await telemetry_manager.connect()
    # Create the SQL tables on the VM database if they don't exist
    await init_db()

# --- STATIC FILE SERVING ---

# Define where the static files live in the container
FRONTEND_DIST = "nf-viz/dist"

# Mount the docs (MkDocs output)
# 'html=True' makes /docs/install/ serve /docs/install/index.html automatically.
DOCS_PATH = f"{FRONTEND_DIST}/docs"
if os.path.exists(DOCS_PATH):
    app.mount("/docs", StaticFiles(directory=DOCS_PATH, html=True), name="docs")

# Mount Assets (Only needed for local dev, in prod all image elements point to absolute bucket urls)
# We use a conditional check so we don't need these files in the production container
ASSETS_PATH = f"{FRONTEND_DIST}/assets"
if os.path.exists(ASSETS_PATH):
    app.mount("/assets", StaticFiles(directory=ASSETS_PATH), name="assets")

# Serve the HTML files vite has processed
@app.get("/")
async def read_index():
    return FileResponse(f"{FRONTEND_DIST}/index.html")

# --- Data Models for API Requests ---

class StreamAuthRequest(BaseModel):
    """Payload sent by MediaMTX to validate a stream publisher or reader."""
    ip: str
    user: str
    password: str  # MediaMTX can pass a token here
    path: str
    protocol: str
    id: str
    action: str
    query: str

# --- HTTP Endpoints ---

@app.post("/internal/auth")
async def media_server_auth(req: StreamAuthRequest):
    """
    Webhook called by MediaMTX.
    Returns 200 OK to allow, 401/403 to deny.
    
    - If action == 'publish', the Robot is trying to stream video.
      We verify the robot has permission to publish
    - If action == 'read', a User is trying to watch via WebRTC.
      We verify the user has permission to view this robot.
    """            
    is_valid = await validate_stream_auth(req, telemetry_manager.decoding_redis)
    if not is_valid:
        logger.info(f"is_valid = {is_valid}")
        raise HTTPException(status_code=403, detail="Forbidden 2")
    return {"status": "OK"}

# --- Robot Control Endpoint ---

@app.websocket("/telemetry/{robot_id}")
async def robot_websocket_endpoint(
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
async def ui_websocket_endpoint(
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
        if not token:
            await websocket.close(code=1008) # code for Policy Violation
            # no token provided
            return

        # Verify Identity
        user_token = await verify_google_token(token)
        user_id = user_token["uid"]
        
        # Check Authorization
        # does the logged in user have permission to
        # 1. observe the robot?
        # 2. issue target or motion commands?
        # 3. issue calibration or shutdown commands?
        # For now, it's just all or nothing.
        if not await check_robot_ownership(user_token["uid"], robot_id):
            logger.warning(f"Unauthorized access attempt to {robot_id}")
            await websocket.close(code=1008)
            return

        logger.info(f"User {user_id} authorized for robot {robot_id}")
        await telemetry_manager.handle_user_connection(websocket, robot_id, user_id)

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from {robot_id}")
        # Cleanup is handled within telemetry_manager, but specific disconnect logic goes here
        await telemetry_manager.disconnect(robot_id, "user")
        
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close(code=1011)
        raise e # raise so trace can be seen in logs


@app.websocket("/simulated/{model}")
async def simulator(
    websocket: WebSocket, 
    model: str,
):
    """
    Endpoint where ui connects. Follows same API as /control/ but requires no token and there is no robot id.
    Telemetry updates from a simluated robot are sent as long as the connection is open.
    """
    await websocket.accept()
    
    try:
        await simulation_manager.handle_user_connection(websocket)        
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close(code=1011)
        raise e # raise so trace can be seen in logs

@app.post("/bind/{robot_id}")
async def bind_robot(
    robot_id: str, 
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    nickname: Optional[str] = "Stringman",
    db: AsyncSession = Depends(get_db)
):
    """Links a robot to a user if it's currently unowned."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    # Check if the robot is already owned by ANYONE
    existing = await db.execute(
        select(RobotOwnership).where(RobotOwnership.robot_id == robot_id)
    )
    ownership = existing.scalar_one_or_none()

    if ownership:
        if ownership.user_id == user_id:
            # If the user already owns it, we allow them to update the nickname
            ownership.nickname = nickname
            await db.commit()
            return {"status": "nickname_updated", "nickname": nickname}
        raise HTTPException(status_code=403, detail="Robot is owned by another user")

    # Claim the robot with the provided nickname
    new_owner = RobotOwnership(user_id=user_id, robot_id=robot_id, nickname=nickname)
    db.add(new_owner)
    await db.commit()
    
    return {"status": "bound", "robot_id": robot_id, "nickname": nickname}

@app.post("/unbind/{robot_id}")
async def unbind_robot(
    robot_id: str,
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Removes a robot from the user's ownership list."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    # Only the owner should be allowed to unbind the robot
    result = await db.execute(
        delete(RobotOwnership).where(
            RobotOwnership.user_id == user_id,
            RobotOwnership.robot_id == robot_id
        )
    )
    
    if result.rowcount == 0:
        # Check if it was owned by someone else or just didn't exist
        existing = await db.execute(
            select(RobotOwnership).where(RobotOwnership.robot_id == robot_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Thats not your robot")
        raise HTTPException(status_code=404, detail="Robot not found")

    await db.commit()
    return {"status": "unbound", "robot_id": robot_id}

@app.get("/listrobots")
async def list_robots(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Returns all robots owned by the logged-in user."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    result = await db.execute(
        select(RobotOwnership).where(RobotOwnership.user_id == user_id)
    )
    owned_bots = result.scalars().all()

    # We fetch the online status for each robot from Redis
    # The telemetry_manager maintains these states as the robots connect/disconnect
    bots_with_status = []
    for b in owned_bots:
        # Fetch the hash containing the online flag for this specific robot
        up_status = await telemetry_manager.decoding_redis.hgetall(f"robot:{b.robot_id}:uplink_state")
        is_online = up_status.get('online') == 'true' if up_status else False
        
        bots_with_status.append({
            'robotid': b.robot_id,
            'nickname': b.nickname or "Unnamed Robot",
            'online': is_online
        })

    return {'bots': bots_with_status}


# by putting this at the end, it is matched with a lower priority.
@app.get("/{page_name}")
async def read_page(page_name: str):
    # Mapping routes to specific HTML files generated by Vite
    page_map = {
        "control_panel": "playroom.html",
        "playroom": "playroom.html",
        "stringman-pilot": "stringman-pilot.html",
        "stringman-arpeggio-pilot": "stringman-arpeggio-pilot.html",
        "company": "company.html",
        "future": "future.html"
    }
    
    if page_name in page_map:
        return FileResponse(f"{FRONTEND_DIST}/{page_map[page_name]}")
    
    # If it's not a known page, let it 404 or return index for SPA behavior
    # Check if the file exists to prevent a crash if the file is missing
    path = f"{FRONTEND_DIST}/{page_name}.html"
    if os.path.exists(path):
         return FileResponse(path)
         
    raise HTTPException(status_code=404, detail="Page not found")