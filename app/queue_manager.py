import redis.asyncio as redis
import time
import os
import logging
from typing import Optional, List, Tuple

logger = logging.getLogger(__name__)

class QueueManager:
    """
    Manages the 'Playroom' queue logic using Redis Sorted Sets.
    """
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis: Optional[redis.Redis] = None
        self.TURN_DURATION_SECONDS = 120  # 2 minutes per turn

    async def connect(self):
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        try:
            await self.redis.ping()
        except Exception as e:
            logger.error(f"QueueManager could not connect to Redis at {self.redis_url}")
            raise e
        logger.info("QueueManager connected to Redis")

    async def join_queue(self, robot_id: str, user_id: str):
        """Adds a user to the waiting line."""
        key = f"queue:{robot_id}"
        current_time = time.time()
        # ZADD adds user with score = timestamp (FIFO queue)
        await self.redis.zadd(key, {user_id: current_time})

    async def leave_queue(self, robot_id: str, user_id: str):
        key = f"queue:{robot_id}"
        await self.redis.zrem(key, user_id)

    async def get_current_driver(self, robot_id: str) -> Optional[str]:
        """Returns the user_id of the person currently driving."""
        key = f"driver:{robot_id}"
        return await self.redis.get(key)

    async def promote_next_driver(self, robot_id: str) -> Optional[str]:
        """
        Pops the next user from the queue and sets them as the active driver.
        Returns the new driver's user_id or None if queue is empty.
        """
        queue_key = f"queue:{robot_id}"
        driver_key = f"driver:{robot_id}"

        # Pop the user with the lowest score (oldest timestamp)
        result = await self.redis.zpopmin(queue_key)
        if not result:
            # Queue is empty, clear driver
            await self.redis.delete(driver_key)
            return None
        
        next_user, _ = result[0] # result is [(member, score)]
        
        # Set them as driver with an expiry (TTL)
        await self.redis.setex(driver_key, self.TURN_DURATION_SECONDS, next_user)
        return next_user

    async def is_driver(self, robot_id: str, user_id: str) -> bool:
        current_driver = await self.get_current_driver(robot_id)
        return current_driver == user_id

    async def get_queue_status(self, robot_id: str) -> dict:
        """Returns metadata for the frontend dashboard."""
        queue_key = f"queue:{robot_id}"
        driver_key = f"driver:{robot_id}"
        
        count = await self.redis.zcard(queue_key)
        driver = await self.redis.get(driver_key)
        ttl = await self.redis.ttl(driver_key) if driver else 0
        
        return {
            "queue_length": count,
            "current_driver": driver,
            "time_remaining": ttl if ttl > 0 else 0
        }

# Global singleton
queue_manager = QueueManager()