import logging
from typing import Optional
import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import HTTPException, status
from sqlalchemy import select
from .database import async_session, RobotOwnership, RobotSharedAccess
from .tickets import get_ticket
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
# On Cloud Run, this automatically uses the default service account.
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app()

async def verify_google_token(token: str) -> dict:
    """
    Verifies the Firebase ID Token (JWT) sent from the frontend.
    Returns the decoded token dictionary containing 'uid', 'email', and custom claims.
    """
    try:
        # check_revoked=True adds a bit of latency but is safer for security-sensitive apps
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True)
        return decoded_token
    except firebase_auth.RevokedIdTokenError:
        logger.warning("Token has been revoked")
        raise HTTPException(status_code=401, detail="Token revoked")
    except firebase_auth.ExpiredIdTokenError:
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
    """Queries Postgres to see if this specific user strictly owns this robot."""
    async with async_session() as session:
        result = await session.execute(
            select(RobotOwnership).where(
                RobotOwnership.user_id == user_id,
                RobotOwnership.robot_id == robot_id
            )
        )
        ownership_record = result.scalar_one_or_none()
        
        if ownership_record:
            return True
            
        return False

async def check_robot_access(user_id: str, user_email: Optional[str], robot_id: str) -> bool:
    """
    Queries Postgres to see if the user owns the robot OR has been granted access via email.
    """
    async with async_session() as session:
        # Check ownership
        owner_result = await session.execute(
            select(RobotOwnership).where(
                RobotOwnership.user_id == user_id,
                RobotOwnership.robot_id == robot_id
            )
        )
        if owner_result.scalar_one_or_none():
            logger.info(f"Access granted: User {user_id} owns Robot {robot_id}")
            return True
            
        # Check shared access via email
        if user_email:
            email_lower = user_email.lower()
            share_result = await session.execute(
                select(RobotSharedAccess).where(
                    RobotSharedAccess.robot_id == robot_id,
                    RobotSharedAccess.guest_email == email_lower
                )
            )
            if share_result.scalar_one_or_none():
                logger.info(f"Access granted: User {user_email} is a guest of Robot {robot_id}")
                return True
                
        logger.warning(f"Access denied: User {user_id} ({user_email}) has no access to Robot {robot_id}")
        return False

async def validate_stream_auth(req, redis_conn, telemetry_manager) -> bool:
    """
    Validates MediaMTX webhook requests.
    req.action is either 'publish' (Robot) or 'read' (User)
    """
    parts = req.path.split('/')
    if len(parts) != 3:
        return False
    robot_id = parts[1]

    if req.action == 'publish':
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
        query_params = parse_qs(req.query)

        if 'ticket' not in query_params:
            logger.info(f'Rejecting stream auth for {robot_id}: no ticket')
            return False

        ticket_id = query_params['ticket'][0]
        ticket = await get_ticket(redis_conn, ticket_id)

        if not ticket or ticket.get('robot_id') != robot_id:
            logger.info(f'Rejecting stream auth: invalid ticket or robot_id mismatch for {robot_id}')
            return False

        user_email = ticket.get('user_email', '').lower()
        user_id = ticket['user_id']

        # Ticket is only valid while the user has an active /control connection.
        connections = telemetry_manager.active_user_connections.get(robot_id, [])
        user_is_connected = any(
            telemetry_manager.user_email.get(ws, '').lower() == user_email
            for ws in connections
        )
        if not user_is_connected:
            logger.info(f'Rejecting stream auth: user {user_email} has no active connection to {robot_id}')
            return False

        # Re-check access in case it was revoked since the ticket was issued.
        if not await check_robot_access(user_id, user_email, robot_id):
            logger.info(f'Rejecting stream auth: user {user_email} no longer has access to {robot_id}')
            return False

        logger.info(f'Stream auth approved via ticket for user {user_email} on {robot_id}')
        return True

    logger.info(f'Rejecting auth request. nothing matched {req}')
    return False