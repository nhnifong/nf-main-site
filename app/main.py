import os
import json
import logging
from typing import Optional, Annotated
from datetime import date
import time

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from .telemetry_manager import telemetry_manager
from .auth import (
    verify_google_token,
    validate_stream_auth,
    check_robot_ownership,
    check_robot_access,
    require_employee,
    require_admin,
    get_user_roles,
    list_user_roles,
    emails_for_uids,
    resolve_email_to_user,
    grant_role,
    revoke_role,
)
from .tickets import create_ticket, get_ticket, delete_user_robot_tickets
from .queue_manager import queue_manager
from .simulation_manager import simulation_manager
from .database import (
    init_db,
    get_db,
    RobotOwnership,
    RobotSharedAccess,
    UserExternalTokens,
    UserRole,
    VALID_ROLES,
    MetricMeasurement,
    count_recently_active_robots,
)
from .metrics import METRIC_DEFINITIONS, METRIC_KEYS
from .product_loader import load_product
from .store import (
    router as store_router,
    templates,
    ASSET_BUCKET_URL,
    STRIPE_TEST_MODE,
    SHIPPING_REGIONS,
    CART_ICON_URL,
    _enrich_product_pricing,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Hugging Face OAuth Credentials (Loaded from environment / GCP Secret Manager)
HF_CLIENT_ID = os.environ.get("HF_CLIENT_ID", "")
HF_CLIENT_SECRET = os.environ.get("HF_CLIENT_SECRET", "")
# This must exactly match the redirect URI registered in Hugging Face developer settings
HF_REDIRECT_URI = os.environ.get("HF_REDIRECT_URI", "https://neufangled.com/hf-redirect")

# When set (prod only), auth requests containing staging=1 are forwarded here instead of being handled locally.
STAGING_CONTROL_PLANE_URL = os.environ.get("STAGING_CONTROL_PLANE_URL", "")

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

# Extensionless page routes -> built HTML files. Single source of truth lives
# in nf-viz/public/page-routes.json (the Vite dev server reads the same file to
# mirror these routes in development). The build copies public/ into dist/.
try:
    with open(f"{FRONTEND_DIST}/page-routes.json") as _f:
        PAGE_ROUTES = json.load(_f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    logger.warning(f"Could not load page-routes.json, page aliases disabled: {e}")
    PAGE_ROUTES = {}

# Permanent redirects for retired slugs -> their current path. Lets old links
# keep working after a product folder is renamed (e.g. the "arpeggio" codename
# was dropped from the public-facing slug).
SLUG_REDIRECTS = {
    "stringman-arpeggio": "stringman",
}

# Redirect /docs → /docs/ so both paths work (StaticFiles needs the trailing slash).
@app.get("/docs")
async def docs_redirect():
    return RedirectResponse(url="/docs/", status_code=301)

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


app.include_router(store_router)

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

class RoleAssignmentRequest(BaseModel):
    """Payload for an admin granting or revoking a role for a user."""
    user_id: str
    role: str

class MetricSubmission(BaseModel):
    """A month's success-metric measurements entered from the employee wizard."""
    # ISO date (YYYY-MM-DD) the measurements were taken.
    measured_on: date
    # Map of metric_key -> recorded score. Unknown keys are rejected.
    values: dict[str, float]

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

    If the request query string contains staging=1, the request is forwarded to the
    staging control plane instead. This is only to save money because staging and prod
    are sharing a MediaMTX server. If staging ever gets it's own mediamtx server just remove this.
    """
    if "staging=1" in req.query and STAGING_CONTROL_PLANE_URL:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{STAGING_CONTROL_PLANE_URL}/internal/auth",
                    json=req.model_dump(),
                    timeout=10.0
                )
            if resp.status_code == 200:
                return {"status": "OK"}
        except Exception as e:
            logger.error(f"Failed to proxy staging auth request: {e}")
        raise HTTPException(status_code=403, detail="Forbidden")

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
            if not ticket_data:
                logger.warning(f"Unknown ticket for {robot_id}")
                await websocket.close(code=1008)
                return
            if ticket_data.get("robot_id") != robot_id:
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


@app.post("/kick/{robot_id}")
async def kick_robot_offline(
    robot_id: str,
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
):
    """Force a robot to appear offline. Owner-only.

    The robot's control-plane websocket is often stale (or held by a different
    server instance), so the reliable action is clearing its uplink_state in
    Redis — mark_robot_online also publishes an offline update to any connected
    UIs. If this instance happens to hold the live socket, we close it too so a
    genuinely-connected robot is actually disconnected rather than just hidden.
    """
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    if not await check_robot_ownership(user_id, robot_id):
        raise HTTPException(status_code=403, detail="Thats not your robot")

    await telemetry_manager.mark_robot_online(robot_id, False)

    # Best-effort: drop a live connection served by this instance.
    ws = telemetry_manager.active_robot_connections.get(robot_id)
    if ws is not None:
        try:
            await ws.close()
        except Exception as e:
            logger.warning(f"Could not close live socket for robot {robot_id}: {e}")

    return {"status": "offline", "robot_id": robot_id}

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

@app.delete("/huggingface/unlink")
async def huggingface_unlink(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(token_auth_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Clears the stored Hugging Face token and username for the authenticated user."""
    user_token = await verify_google_token(creds.credentials)
    user_id = user_token["uid"]

    result = await db.execute(
        select(UserExternalTokens).where(UserExternalTokens.user_id == user_id)
    )
    record = result.scalar_one_or_none()

    if record:
        record.hf_access_token = None
        record.hf_username = None
        await db.commit()

    return {"status": "success"}


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



# --- Employee area ---

@app.get("/employee")
async def employee_home(request: Request):
    """Serves the employee landing page shell.

    The page itself is a thin shell — it signs in via Firebase client-side and
    then calls /employee/hello, which is what actually enforces the employee
    gate. Non-employees who load this page see an access-denied message.
    """
    return templates.TemplateResponse(request, "employee_landing.html", {})


@app.get("/employee/hello")
async def employee_hello(user: Annotated[dict, Depends(require_employee)]):
    """Employee-only data, used by the landing page as its access gate. 403 for
    everyone else."""
    return {
        "message": "Hello, world! Welcome to the employee area.",
        "email": user.get("email"),
        "roles": sorted(user.get("roles", [])),
    }


# --- Success metrics ---

@app.get("/employee/metrics")
async def employee_metrics_page(request: Request):
    """Serves the monthly score-entry page. It signs in via Firebase and fetches
    the employee-gated /api/metrics/definitions; the gate is enforced there and
    on the POST, not by this page."""
    return templates.TemplateResponse(request, "metrics_entry.html", {})


@app.get("/api/metrics/definitions")
async def metrics_definitions(user: Annotated[dict, Depends(require_employee)]):
    """The metric list the score-entry page prompts through. Employee-gated; also
    serves as the access check the page runs on load before showing the form."""
    return {"metrics": METRIC_DEFINITIONS}


@app.get("/api/metrics")
async def metrics_all(db: AsyncSession = Depends(get_db)):
    """Public: the entire measurement history, in one call, for the scoreboard.

    The scoreboard derives both the latest value per metric and the time-series
    plots from this single response. Sorted oldest-first.
    """
    result = await db.execute(
        select(MetricMeasurement).order_by(
            MetricMeasurement.measured_on.asc(), MetricMeasurement.id.asc()
        )
    )
    return {
        # Metadata so the scoreboard can label and color the trend lines without a
        # second request.
        "metrics": [
            {
                "key": m["key"],
                "title": m["title"],
                "section": m["section"],
                "unit": m["unit"],
            }
            for m in METRIC_DEFINITIONS
        ],
        "measurements": [
            {
                "measured_on": row.measured_on.isoformat(),
                "metric_key": row.metric_key,
                "value": row.value,
            }
            for row in result.scalars().all()
        ],
    }


@app.get("/api/fleet/active_count")
async def fleet_active_count():
    """Public: number of distinct robots seen online in the last 3 months — the
    'deployed' fleet size shown on the scoreboard hero."""
    count = await count_recently_active_robots(months=3)
    # plus additional robots which are known to be deployed in lan mode by testers
    count += 4
    return {"active_count": count, "window_months": 3}


@app.post("/api/metrics")
async def submit_metrics(
    submission: MetricSubmission,
    user: Annotated[dict, Depends(require_employee)],
    db: AsyncSession = Depends(get_db),
):
    """Records a measurement session. History is kept per day, but a metric may
    have only one score per day — re-submitting a metric for the same day
    overwrites that day's value. Employee-gated."""
    unknown = set(submission.values) - METRIC_KEYS
    if unknown:
        raise HTTPException(status_code=400, detail=f"Unknown metric keys: {sorted(unknown)}")
    if not submission.values:
        raise HTTPException(status_code=400, detail="No metric values provided")

    uid = user["uid"]
    for key, value in submission.values.items():
        # Upsert on (measured_on, metric_key): one score per metric per day.
        await db.execute(
            pg_insert(MetricMeasurement)
            .values(
                measured_on=submission.measured_on,
                metric_key=key,
                value=value,
                recorded_by=uid,
            )
            .on_conflict_do_update(
                index_elements=["measured_on", "metric_key"],
                set_={"value": value, "recorded_by": uid},
            )
        )
    await db.commit()
    return {"status": "recorded", "measured_on": submission.measured_on.isoformat(),
            "count": len(submission.values)}


# --- Role administration (employee_admin only) ---

@app.get("/employee/admin")
async def employee_admin_page(request: Request):
    """Serves the role-administration page shell (employee_admin only).

    Like the other employee pages, this is a thin shell: it signs in via
    Firebase client-side, and the employee_admin gate is enforced by the
    /admin/* APIs it calls — not by serving this HTML.
    """
    return templates.TemplateResponse(request, "employee_admin.html", {
        "valid_roles": sorted(VALID_ROLES),
    })


@app.get("/admin/users")
async def admin_list_users(admin: Annotated[dict, Depends(require_admin)]):
    """Every user that holds at least one role, with emails resolved for display.
    Sorted by email so the roster reads naturally in the admin table."""
    roles_by_user = await list_user_roles()
    emails = emails_for_uids(list(roles_by_user.keys()))
    users = [
        {"user_id": uid, "email": emails.get(uid), "roles": sorted(roles)}
        for uid, roles in roles_by_user.items()
    ]
    users.sort(key=lambda u: (u["email"] or "￿").lower())
    return {"users": users}


@app.get("/admin/users/lookup")
async def admin_lookup_user(
    email: str,
    admin: Annotated[dict, Depends(require_admin)],
):
    """Resolve an email to its Firebase user so an admin can grant a first role.
    Returns the user's current roles (empty if none). 404 if no such user."""
    resolved = resolve_email_to_user(email)
    if not resolved:
        raise HTTPException(status_code=404, detail="No Firebase user with that email.")
    uid, resolved_email = resolved
    roles = await get_user_roles(uid)
    return {"user_id": uid, "email": resolved_email, "roles": sorted(roles)}


@app.get("/admin/roles/{target_user_id}")
async def admin_get_roles(
    target_user_id: str,
    admin: Annotated[dict, Depends(require_admin)],
):
    """Returns the roles held by a given Firebase UID."""
    roles = await get_user_roles(target_user_id)
    return {"user_id": target_user_id, "roles": sorted(roles)}


@app.post("/admin/roles")
async def admin_grant_role(
    req: RoleAssignmentRequest,
    admin: Annotated[dict, Depends(require_admin)],
):
    """Grants a role to a user (idempotent)."""
    if req.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Unknown role: {req.role}")
    await grant_role(req.user_id, req.role)
    return {"status": "granted", "user_id": req.user_id, "role": req.role}


@app.delete("/admin/roles")
async def admin_revoke_role(
    req: RoleAssignmentRequest,
    admin: Annotated[dict, Depends(require_admin)],
):
    """Revokes a role from a user."""
    if req.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Unknown role: {req.role}")
    removed = await revoke_role(req.user_id, req.role)
    if not removed:
        raise HTTPException(status_code=404, detail="User did not have that role")
    return {"status": "revoked", "user_id": req.user_id, "role": req.role}


# by putting this at the end, it is matched with a lower priority.
@app.get("/{page_name}")
async def read_page(request: Request, page_name: str):
    # Retired slugs (e.g. renamed product folders) redirect to their new path.
    if page_name in SLUG_REDIRECTS:
        return RedirectResponse(url=f"/{SLUG_REDIRECTS[page_name]}", status_code=301)

    # Static pages built by Vite (route map shared with the frontend, see
    # PAGE_ROUTES / nf-viz/public/page-routes.json).
    if page_name in PAGE_ROUTES:
        return FileResponse(f"{FRONTEND_DIST}/{PAGE_ROUTES[page_name]}")

    # Product pages — loaded from products/{slug}/ directory
    product = load_product(page_name, ASSET_BUCKET_URL, STRIPE_TEST_MODE)
    if product:
        await _enrich_product_pricing(product)
        return templates.TemplateResponse(request, "product.html", {
            "product": product,
            "shipping_regions": SHIPPING_REGIONS,
            "cart_icon_url": CART_ICON_URL,
        })

    raise HTTPException(status_code=404, detail="Page not found")