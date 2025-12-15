import logging
from typing import Optional
from fastapi import HTTPException
# In production, import User/Robot database models and hashing logic

logger = logging.getLogger(__name__)

# --- Mock Data for Prototype ---
MOCK_ROBOTS = {
    "robot_01": "secret_stream_key_123", # ID: StreamKey
    "playroom_bot": "public_demo_key"
}

MOCK_USERS = {
    "user_token_abc": "user_1",
    "user_token_xyz": "user_2"
}

async def validate_stream_auth(req) -> bool:
    """
    Validates MediaMTX webhook requests.
    req.action is either 'publish' (Robot) or 'read' (User)

    test endpoint with curl

curl -X POST http://localhost:8080/internal/auth \
  -H "Content-Type: application/json" \
  -d '{
  "user": "user",
  "password": "password",
  "token": "token",
  "ip": "ip",
  "action": "publish",
  "path": "path",
  "protocol": "rtsp",
  "id": "id",
  "query": "query"
}'

    """
    if req.action == 'publish':
        # Robot is trying to stream. Check if ID exists and password matches stream key.
        # DB Lookup: stored_key = db.query(Robot).get(req.id).stream_key
        stored_key = MOCK_ROBOTS.get(req.id)
        
        if stored_key and stored_key == req.password:
            logger.info(f"Stream Auth Success: Robot {req.id} authorized to publish.")
            return True
        logger.warning(f"Stream Auth Failed: Robot {req.id} invalid key.")
        return False

    elif req.action == 'read':
        # User is trying to watch WebRTC. Check if they have permission.
        # Req.query contains query params, e.g., "token=abc"
        # Parse query string to get token
        # For prototype, we might allow public read for playroom
        if req.id == "playroom_bot":
            return True
            
        # For private robots, verify token
        # This parsing depends on how MediaMTX passes query params. 
        # Often passed as raw string in req.query
        return True # Permissive for now for read

    return False

async def get_current_user_ws(token: Optional[str]) -> str:
    """
    Validates a WebSocket token and returns user_id.
    """
    if not token:
        # In Playroom, anonymous users might be allowed to spectate, 
        # but usually need a temp ID for the queue.
        return "anon_guest"
    
    user_id = MOCK_USERS.get(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid Token")
    return user_id

async def get_current_robot_ws(token: Optional[str], robot_id: str):
    """
    Validates that the connection is actually coming from the robot hardware.
    """
    # In reality, Robot sends a specialized token or API key.
    # For prototype, check if token matches the stream key or similar secret
    expected_key = MOCK_ROBOTS.get(robot_id)
    if token != expected_key:
         raise HTTPException(status_code=403, detail="Invalid Robot Credentials")
    return True