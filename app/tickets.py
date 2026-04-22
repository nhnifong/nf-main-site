import json
import logging
import secrets

logger = logging.getLogger(__name__)

_TICKET_PREFIX = "ticket:"
_USER_ROBOT_TICKETS_PREFIX = "user_robot_tickets:"


async def create_ticket(redis_conn, user_id: str, user_email: str, robot_id: str) -> str:
    ticket_id = secrets.token_urlsafe(32)
    ticket_data = json.dumps({
        "user_id": user_id,
        "user_email": user_email or "",
        "robot_id": robot_id,
    })
    pipe = redis_conn.pipeline()
    pipe.set(f"{_TICKET_PREFIX}{ticket_id}", ticket_data)
    pipe.sadd(f"{_USER_ROBOT_TICKETS_PREFIX}{user_id}:{robot_id}", ticket_id)
    await pipe.execute()
    logger.info(f"Created stream ticket for user {user_id} on robot {robot_id}")
    return ticket_id


async def get_ticket(redis_conn, ticket_id: str) -> dict | None:
    data = await redis_conn.get(f"{_TICKET_PREFIX}{ticket_id}")
    if not data:
        return None
    return json.loads(data)


async def delete_user_robot_tickets(redis_conn, user_id: str, robot_id: str):
    ticket_set_key = f"{_USER_ROBOT_TICKETS_PREFIX}{user_id}:{robot_id}"
    ticket_ids = await redis_conn.smembers(ticket_set_key)
    if not ticket_ids:
        return
    pipe = redis_conn.pipeline()
    for ticket_id in ticket_ids:
        pipe.delete(f"{_TICKET_PREFIX}{ticket_id}")
    pipe.delete(ticket_set_key)
    await pipe.execute()
    logger.info(f"Deleted {len(ticket_ids)} stream ticket(s) for user {user_id} on robot {robot_id}")
