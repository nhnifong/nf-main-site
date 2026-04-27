import os
import logging
from typing import Optional, Annotated

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from .telemetry_manager import telemetry_manager
from .auth import verify_google_token, validate_stream_auth, check_robot_ownership, check_robot_access
from .tickets import create_ticket, get_ticket, delete_user_robot_tickets
from .queue_manager import queue_manager
from .simulation_manager import simulation_manager
from .database import init_db, get_db, RobotOwnership, RobotSharedAccess, UserExternalTokens
from .product_loader import load_product, load_all_products

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Asset bucket URL — baked in at Docker build time (same value Vite uses).
# Falls back to "" in local dev, making image paths relative (e.g. /assets/foo.jpg).
ASSET_BUCKET_URL = os.environ.get("VITE_ASSET_BUCKET_URL", "")

# Hugging Face OAuth Credentials (Loaded from environment / GCP Secret Manager)
HF_CLIENT_ID = os.environ.get("HF_CLIENT_ID", "")
HF_CLIENT_SECRET = os.environ.get("HF_CLIENT_SECRET", "")
# This must exactly match the redirect URI registered in Hugging Face developer settings
HF_REDIRECT_URI = os.environ.get("HF_REDIRECT_URI", "https://neufangled.com/hf-redirect")

templates = Jinja2Templates(directory="app/templates")

app = FastAPI(
    title="Neufangled Control Plane",
    openapi_url=None,
    docs_url=None, 
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO, use env variable. In production, restrict this to neufangled.com
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

# Mount app/static for CSS and other assets used by server-side-rendered pages
app.mount("/static", StaticFiles(directory="app/static"), name="app-static")

# Serve the HTML files vite has processed
@app.get("/")
async def read_index():
    return FileResponse(f"{FRONTEND_DIST}/index.html")


@app.get("/store")
async def store_page(request: Request):
    products = load_all_products(ASSET_BUCKET_URL)
    return templates.TemplateResponse(request, "store.html", {"products": products})

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

class ShareRequest(BaseModel):
    guest_email: EmailStr

class HuggingFaceExchangeRequest(BaseModel):
    code: str

# --- HTTP Endpoints ---

@app.post("/ticket/{robot_id}")
async def create_stream_ticket(
    robot_id: str,
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
):
    """
    Issues a short-lived stream ticket for the authenticated user.
    The ticket can be passed as ?ticket= to the WHEP endpoint instead of a Firebase token.
    It stays valid only while the user has an active /control connection and retains access.
    """
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]
    user_email = user_token.get("email", "")

    if not await check_robot_access(user_id, user_email, robot_id):
        raise HTTPException(status_code=403, detail="Access denied")

    ticket = await create_ticket(telemetry_manager.decoding_redis, user_id, user_email, robot_id)
    return {"ticket": ticket}


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
    is_valid = await validate_stream_auth(req, telemetry_manager.decoding_redis, telemetry_manager)
    if not is_valid:
        logger.info(f"is_valid = {is_valid}")
        raise HTTPException(status_code=403, detail="Forbidden 2")
    return {"status": "OK"}

@app.websocket("/telemetry/{robot_id}")
async def robot_websocket_endpoint(
    websocket: WebSocket,
    robot_id: str,
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

@app.websocket("/control/{robot_id}")
async def ui_websocket_endpoint(
    websocket: WebSocket,
    robot_id: str,
    ticket: Optional[str] = None,
):
    """
    Endpoint where web based robot ui connects to send controls and receive telemetry messages.
       - Subscribe to 'state:{robot_id}' Redis channel to get updates.
       - If Playroom: Check Queue Manager. If Driver, allow writes to 'commands:{robot_id}'.
    """
    await websocket.accept()

    # Token must be in the Authorization header; query-param tokens are no longer accepted.
    token: Optional[str] = None
    auth_header = websocket.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]

    user_id: Optional[str] = None
    try:
        if token:
            # Non-browser clients (e.g. server-to-server) send a Firebase token via Bearer header.
            user_token = await verify_google_token(token)
            user_id = user_token["uid"]
            user_email = user_token.get("email")
        elif ticket:
            # Ticket auth: look up pre-issued ticket to get identity.
            ticket_data = await get_ticket(telemetry_manager.decoding_redis, ticket)
            if not ticket_data or ticket_data.get("robot_id") != robot_id:
                logger.warning(f"Invalid ticket for {robot_id}")
                await websocket.close(code=1008)
                return
            user_id = ticket_data["user_id"]
            user_email = ticket_data.get("user_email")
        else:
            await websocket.close(code=1008)  # Policy Violation — no credentials
            return

        if not await check_robot_access(user_id, user_email, robot_id):
            logger.warning(f"Unauthorized access attempt to {robot_id}")
            await websocket.close(code=1008)
            return

        logger.info(f"User {user_id} authorized for robot {robot_id}")
        await telemetry_manager.handle_user_connection(websocket, robot_id, user_id, user_email or "")

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from {robot_id}")
        await telemetry_manager.disconnect(robot_id, "user")

    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close(code=1011)
        raise e  # raise so trace can be seen in logs

    finally:
        if user_id:
            await delete_user_robot_tickets(telemetry_manager.decoding_redis, user_id, robot_id)


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

# --- Sharing Endpoints ---

@app.post("/share/{robot_id}")
async def share_robot(
    robot_id: str,
    req: ShareRequest,
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Allows the owner to grant access to another user via email."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    # Verify the user is the strict owner
    if not await check_robot_ownership(user_id, robot_id):
        raise HTTPException(status_code=403, detail="Only the owner can share this robot.")

    guest_email_lower = req.guest_email.lower()

    # Check if already shared
    existing = await db.execute(
        select(RobotSharedAccess).where(
            RobotSharedAccess.robot_id == robot_id,
            RobotSharedAccess.guest_email == guest_email_lower
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already_shared", "guest_email": guest_email_lower}

    # Grant access
    new_share = RobotSharedAccess(
        robot_id=robot_id, 
        owner_id=user_id, 
        guest_email=guest_email_lower
    )
    db.add(new_share)
    await db.commit()

    return {"status": "shared", "guest_email": guest_email_lower}

@app.delete("/share/{robot_id}/{guest_email}")
async def revoke_robot_access(
    robot_id: str,
    guest_email: str,
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Revokes a previously granted access."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    if not await check_robot_ownership(user_id, robot_id):
        raise HTTPException(status_code=403, detail="Only the owner can revoke access.")

    result = await db.execute(
        delete(RobotSharedAccess).where(
            RobotSharedAccess.robot_id == robot_id,
            RobotSharedAccess.guest_email == guest_email.lower()
        )
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Share record not found")

    # Boot the user if they're currently connected, across all server instances
    await telemetry_manager.pub_redis.publish(f"revoke:{guest_email.lower()}", robot_id.encode())

    return {"status": "revoked", "guest_email": guest_email}

@app.get("/list_authorized/{robot_id}")
async def list_shared_users(
    robot_id: str,
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Returns a list of emails this robot is shared with (Owner only)."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    if not await check_robot_ownership(user_id, robot_id):
        raise HTTPException(status_code=403, detail="Only the owner can view sharing settings.")

    result = await db.execute(
        select(RobotSharedAccess.guest_email).where(RobotSharedAccess.robot_id == robot_id)
    )
    emails = result.scalars().all()
    
    return {"shared_with": emails}

@app.get("/listrobots")
async def list_robots(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Returns robots owned by OR shared with the logged-in user."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]
    user_email = user_token.get("email", "").lower()

    # Fetch strictly owned robots
    owned_res = await db.execute(
        select(RobotOwnership).where(RobotOwnership.user_id == user_id)
    )
    owned_bots = owned_res.scalars().all()

    # Fetch robots shared with this user's email
    shared_bots = []
    if user_email:
        # Join against RobotOwnership to get the nickname set by the owner
        shared_res = await db.execute(
            select(RobotOwnership)
            .join(RobotSharedAccess, RobotOwnership.robot_id == RobotSharedAccess.robot_id)
            .where(RobotSharedAccess.guest_email == user_email)
        )
        shared_bots = shared_res.scalars().all()

    bots_with_status = []
    
    async def append_bot_data(bot, role):
        up_status = await telemetry_manager.decoding_redis.hgetall(f"robot:{bot.robot_id}:uplink_state")
        is_online = up_status.get('online') == 'true' if up_status else False
        bots_with_status.append({
            'robotid': bot.robot_id,
            'nickname': bot.nickname or "Unnamed Robot",
            'online': is_online,
            'role': role # Frontend can use this to disable the "Unbind" or "Share" UI buttons
        })

    for b in owned_bots:
        await append_bot_data(b, "owner")
        
    for b in shared_bots:
        await append_bot_data(b, "guest")

    return {'bots': bots_with_status}

# --- OAuth & Hugging Face Integrations ---

@app.post("/huggingface/exchange_code")
async def huggingface_exchange_code(
    req: HuggingFaceExchangeRequest,
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """
    Called by frontend after it receives a code from Hugging Face's redirect.
    Exchanges the code for a permanent token, fetches the user's HF username, 
    and saves it all to the database.
    """
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    # Exchange the code for an Access Token
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://huggingface.co/oauth/token", data={
            "grant_type": "authorization_code",
            "client_id": HF_CLIENT_ID,
            "client_secret": HF_CLIENT_SECRET,
            "code": req.code,
            "redirect_uri": HF_REDIRECT_URI
        })
        
        if token_res.status_code != 200:
            logger.error(f"HF Token Exchange Failed: {token_res.text}")
            raise HTTPException(status_code=400, detail="Invalid or expired authorization code.")
            
        token_data = token_res.json()
        hf_access_token = token_data.get("access_token")

        # Fetch the user's Hugging Face username using their new token
        whoami_res = await client.get(
            "https://huggingface.co/api/whoami-v2", 
            headers={"Authorization": f"Bearer {hf_access_token}"}
        )
        
        if whoami_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch Hugging Face profile data.")
            
        hf_username = whoami_res.json().get("name")

    # Store the token and username in the database
    # Check if a record exists for this Firebase user
    result = await db.execute(
        select(UserExternalTokens).where(UserExternalTokens.user_id == user_id)
    )
    existing_record = result.scalar_one_or_none()

    if existing_record:
        existing_record.hf_access_token = hf_access_token
        existing_record.hf_username = hf_username
    else:
        new_record = UserExternalTokens(
            user_id=user_id,
            hf_access_token=hf_access_token,
            hf_username=hf_username
        )
        db.add(new_record)
        
    await db.commit()

    return {"status": "success", "hf_username": hf_username}

@app.get("/huggingface/status")
async def get_huggingface_status(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Allows the frontend to check if the current user has connected their Hugging Face account."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    result = await db.execute(
        select(UserExternalTokens).where(UserExternalTokens.user_id == user_id)
    )
    record = result.scalar_one_or_none()

    oauth_url = (
        f"https://huggingface.co/oauth/authorize"
        f"?client_id={HF_CLIENT_ID}"
        f"&redirect_uri={HF_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=contribute-repos%20openid%20profile"
        f"&prompt=consent"
        f"&state=1234567890"
    )

    if record and record.hf_access_token:
        return {"connected": True, "hf_username": record.hf_username, "oauth_url": oauth_url}

    return {"connected": False, "oauth_url": oauth_url}

# by putting this at the end, it is matched with a lower priority.
@app.get("/{page_name}")
async def read_page(request: Request, page_name: str):
    # Static pages built by Vite
    page_map = {
        "control_panel": "playroom.html",
        "playroom": "playroom.html",
        "company": "company.html",
        "future": "future.html",
        "payment_options": "payment_options.html",
        "hf-redirect": "hf-redirect.html",
    }

    if page_name in page_map:
        return FileResponse(f"{FRONTEND_DIST}/{page_map[page_name]}")

    # Product pages — loaded from products/{slug}/ directory
    product = load_product(page_name, ASSET_BUCKET_URL)
    if product:
        return templates.TemplateResponse(request, "product.html", {"product": product})

    raise HTTPException(status_code=404, detail="Page not found")