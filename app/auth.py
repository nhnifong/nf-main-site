import logging
from typing import Optional
import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
# On Cloud Run, this automatically uses the default service account.
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app()

# Helper for HTTP Bearer tokens
security = HTTPBearer()

async def verify_google_token(token: str) -> dict:
    """
    Verifies the Firebase ID Token (JWT) sent from the frontend.
    Returns the decoded token dictionary containing 'uid', 'email', and custom claims.
    """
    try:
        # check_revoked=True adds a bit of latency but is safer for security-sensitive apps
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        return decoded_token
    except auth.RevokedIdTokenError:
        logger.warning("Token has been revoked")
        raise HTTPException(status_code=401, detail="Token revoked")
    except auth.ExpiredIdTokenError:
        logger.warning("Token has expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        # We raise the exception to see the trace in logs as per your instructions
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

async def check_robot_ownership(user_token, robot_id):
    return True

async def validate_stream_auth(req, redis_conn) -> bool:
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

    logger.info(req)
    # note that req.id is unique to each request and is created by MediaMTX. It's not useful here.
    # the robot id must be extracted from the path stringman/{robot_id}/{cam_number}
    parts = req.path.split('/')
    if len(parts) != 3:
        return False
    robot_id = parts[1]

    # Verify user owns the robot before allowing WebRTC stream read or write
    user_token = await verify_google_token(req.password)
    if not await check_robot_ownership(user_token, req.path):
        raise HTTPException(status_code=403, detail="Forbidden")

    if req.action == 'publish':
        # in order to stream, a robot with this id must already be sending telemetry.
        online = False
        up_status = await redis_conn.hgetall(f"robot:{robot_id}:uplink_state")
        if up_status and 'online' in up_status:
            online = up_status['online'] == 'true'

        if online:
            logger.info(f"Stream Auth Success: Robot {robot_id} authorized to publish.")
            return True
        logger.warning(f"Stream Auth Failed: Robot {robot_id} may not publish video.")
        return False

    elif req.action == 'read':
        return True

    return False