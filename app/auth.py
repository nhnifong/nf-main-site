import logging
import os
from typing import Optional, Annotated
import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from .database import (
    async_session,
    RobotOwnership,
    RobotSharedAccess,
    UserRole,
    EMPLOYEE_ROLES,
    ROLE_EMPLOYEE_ADMIN,
)
from .tickets import get_ticket
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)

# Emails (comma-separated, case-insensitive) that are always granted
# employee_admin the first time they authenticate. This bootstraps the very
# first admin, who can then grant roles to everyone else via the admin API.
BOOTSTRAP_ADMIN_EMAILS = frozenset(
    e.strip().lower()
    for e in os.environ.get("BOOTSTRAP_ADMIN_EMAILS", "").split(",")
    if e.strip()
)

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


# --- Role management ---

async def get_user_roles(user_id: str) -> set[str]:
    """Returns the set of roles held by this Firebase UID (empty if none)."""
    async with async_session() as session:
        result = await session.execute(
            select(UserRole.role).where(UserRole.user_id == user_id)
        )
        return set(result.scalars().all())


async def list_user_roles() -> dict[str, set[str]]:
    """Every user that holds at least one role, mapped Firebase UID -> roles.

    Used by the admin role-management page to render the full roster in one
    query (users with no roles at all never appear in user_roles, so they're
    reached via resolve_email_to_user instead).
    """
    async with async_session() as session:
        result = await session.execute(select(UserRole.user_id, UserRole.role))
        roles_by_user: dict[str, set[str]] = {}
        for user_id, role in result.all():
            roles_by_user.setdefault(user_id, set()).add(role)
        return roles_by_user


def emails_for_uids(uids: list[str]) -> dict[str, Optional[str]]:
    """Best-effort map of Firebase UID -> email, for display in the admin UI.

    One lookup per UID — fine for the small set of users who hold roles. A UID
    Firebase can't resolve (e.g. a deleted account) is simply absent from the
    result rather than failing the whole listing.
    """
    emails: dict[str, Optional[str]] = {}
    for uid in uids:
        try:
            emails[uid] = firebase_auth.get_user(uid).email
        except firebase_auth.UserNotFoundError:
            continue
    return emails


def resolve_email_to_user(email: str) -> Optional[tuple[str, str]]:
    """Resolve an email to (uid, email) via Firebase, or None if no such user.

    Lets an admin grant a role to someone who holds none yet — the only way to
    learn their UID, since the database keys everything by UID.
    """
    try:
        record = firebase_auth.get_user_by_email(email)
        return record.uid, record.email
    except firebase_auth.UserNotFoundError:
        return None


async def resolve_user_roles(user_id: str, email: Optional[str]) -> set[str]:
    """Returns the user's roles, granting bootstrap admins their role on first sight.

    A user whose email is in BOOTSTRAP_ADMIN_EMAILS is persisted as an
    employee_admin the first time this runs, so the very first staff member can
    sign in and start assigning roles without any manual database edits.
    """
    roles = await get_user_roles(user_id)

    if email and email.lower() in BOOTSTRAP_ADMIN_EMAILS and ROLE_EMPLOYEE_ADMIN not in roles:
        await grant_role(user_id, ROLE_EMPLOYEE_ADMIN)
        roles.add(ROLE_EMPLOYEE_ADMIN)
        logger.info(f"Bootstrapped employee_admin for {email} ({user_id})")

    return roles


async def grant_role(user_id: str, role: str) -> None:
    """Grants a role to a user. Idempotent — granting an existing role is a no-op."""
    async with async_session() as session:
        # ON CONFLICT DO NOTHING so re-granting an existing role doesn't error.
        await session.execute(
            pg_insert(UserRole)
            .values(user_id=user_id, role=role)
            .on_conflict_do_nothing(index_elements=["user_id", "role"])
        )
        await session.commit()


async def revoke_role(user_id: str, role: str) -> bool:
    """Revokes a role from a user. Returns True if a role was actually removed."""
    from sqlalchemy import delete
    async with async_session() as session:
        result = await session.execute(
            delete(UserRole).where(UserRole.user_id == user_id, UserRole.role == role)
        )
        await session.commit()
        return result.rowcount > 0


# --- Auth dependencies (FastAPI) ---

_bearer_scheme = HTTPBearer()


async def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(_bearer_scheme)],
) -> dict:
    """Dependency: verifies the Firebase token and returns the decoded claims."""
    return await verify_google_token(creds.credentials)


async def require_employee(
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Dependency: allows the request only if the user holds any employee role.

    Returns the decoded token with a `roles` set attached for downstream use.
    """
    roles = await resolve_user_roles(user["uid"], user.get("email"))
    if not (roles & EMPLOYEE_ROLES):
        raise HTTPException(status_code=403, detail="Employees only")
    user["roles"] = roles
    return user


async def require_admin(
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Dependency: allows the request only if the user is an employee_admin."""
    roles = await resolve_user_roles(user["uid"], user.get("email"))
    if ROLE_EMPLOYEE_ADMIN not in roles:
        raise HTTPException(status_code=403, detail="Admins only")
    user["roles"] = roles
    return user


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