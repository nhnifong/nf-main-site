import logging
from typing import Optional
import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from .database import async_session, RobotOwnership
from urllib.parse import parse_qs

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

async def check_robot_ownership(user_id: str, robot_id: str) -> bool:
    """Queries Postgres to see if this specific user owns this robot."""
    async with async_session() as session:
        result = await session.execute(
            select(RobotOwnership).where(
                RobotOwnership.user_id == user_id,
                RobotOwnership.robot_id == robot_id
            )
        )
        
        # Capture the object before logging or returning to avoid consuming the iterator.
        ownership_record = result.scalar_one_or_none()
        
        if ownership_record:
            logger.info(f"Ownership verified: User {user_id} owns Robot {robot_id} (Nickname: {ownership_record.nickname})")
            return True
            
        logger.warning(f"Ownership check failed: User {user_id} does not own Robot {robot_id}")
        return False

async def validate_stream_auth(req, redis_conn) -> bool:
    """
    Validates MediaMTX webhook requests.
    req.action is either 'publish' (Robot) or 'read' (User)

    typical request from mediamtx

    {
        ip='172.18.0.1'
        user=''
        password=''
        path='stringman/28cbd7fb-70fc-4716-ac5b-1feaf566aa26/1'
        protocol='webrtc'
        id='00c47665-643b-475b-811a-01ff879d1553'
        action='read'
        query='token=blablabla'

    """
    # note that req.id is unique to each request and is created by MediaMTX. It's not useful here.
    # the robot id must be extracted from the path stringman/{robot_id}/{cam_number}
    parts = req.path.split('/')
    if len(parts) != 3:
        return False
    robot_id = parts[1]

    # Verify user owns the robot before allowing WebRTC stream read or write
    query_params = parse_qs(req.query)


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
        if not 'token' in query_params:
            logger.info('Rejecting auth request from mediaMTX because there was no token in the query params')
            return False
        token = query_params['token'][0]
        user_token = await verify_google_token(token)
        if not await check_robot_ownership(user_token['uid'], robot_id):
            logger.info('Rejecting auth request from mediaMTX because the user doenst appear to own this robot')
            raise HTTPException(status_code=403, detail="Forbidden 1")
        return True

    logger.info(f'Rejecting auth request. nothing matched {req}')
    return False