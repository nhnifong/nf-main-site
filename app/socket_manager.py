import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket
import redis.asyncio as redis
import os

from .queue_manager import queue_manager

logger = logging.getLogger(__name__)

class SocketManager:
    """
    Handles WebSocket connections and Redis Pub/Sub routing.
    - Routes user commands -> Redis 'commands:robot_id' -> Robot
    - Routes robot state -> Redis 'state:robot_id' -> Users
    """
    def __init__(self):
        self.active_user_connections: Dict[str, List[WebSocket]] = {} # robot_id -> [ws, ws]
        self.active_robot_connections: Dict[str, WebSocket] = {}      # robot_id -> ws
        
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.pub_redis = None
        self.sub_redis = None
        self.listen_task = None

    async def connect(self):
        """Initialize Redis connections."""
        # One connection for publishing
        self.pub_redis = redis.from_url(self.redis_url, decode_responses=True)
        # Separate connection for subscribing (blocking)
        self.sub_redis = redis.from_url(self.redis_url, decode_responses=True)
        
        try:
            await self.pub_redis.ping()
            await self.sub_redis.ping()
        except Exception as e:
            logger.error(f"Could not connect to Redis at {self.redis_url}")
            raise e
        
        # Start background listener
        self.listen_task = asyncio.create_task(self.listen_to_redis())
        logger.info("SocketManager connected to Redis")

    async def disconnect(self, robot_id: str, client_type: str, websocket: WebSocket = None):
        if client_type == "robot":
            if robot_id in self.active_robot_connections:
                del self.active_robot_connections[robot_id]
        else:
            if robot_id in self.active_user_connections:
                if websocket in self.active_user_connections[robot_id]:
                    self.active_user_connections[robot_id].remove(websocket)

    async def handle_robot_connection(self, websocket: WebSocket, robot_id: str):
        """
        Logic for the Physical Robot connecting to Cloud.
        1. Listen for messages from Robot (State Updates).
        2. Publish State to Redis (so users get it).
        """
        self.active_robot_connections[robot_id] = websocket
        try:
            while True:
                data = await websocket.receive_text()
                # Robot sends its state (JSON)
                # We publish this to Redis so all web servers can broadcast it
                await self.pub_redis.publish(f"state:{robot_id}", data)
        except Exception as e:
            logger.error(f"Robot {robot_id} connection lost: {e}")
            await self.disconnect(robot_id, "robot")

    async def handle_user_connection(self, websocket: WebSocket, robot_id: str, user_id: str):
        """
        Logic for a Browser User connecting.
        1. Listen for commands (UP, DOWN, GRAB).
        2. Check permissions (Is Owner? Is Playroom Driver?).
        3. Publish Command to Redis (so Robot gets it).
        """
        if robot_id not in self.active_user_connections:
            self.active_user_connections[robot_id] = []
        self.active_user_connections[robot_id].append(websocket)

        try:
            while True:
                data = await websocket.receive_text()
                # User sent a command
                command = json.loads(data)
                
                # --- PERMISSION CHECK ---
                # 1. Is it a private robot? (Check DB owner) -> Allow
                # 2. Is it a public demo? (Check Queue)
                is_allowed = False
                
                # For this artifact, assume public demo logic if robot_id starts with 'playroom'
                if robot_id.startswith("playroom"):
                    if await queue_manager.is_driver(robot_id, user_id):
                        is_allowed = True
                    else:
                        # Optional: Send "Not your turn" error back to user
                        pass
                else:
                    # Assume Private owner for now
                    is_allowed = True

                if is_allowed:
                    # Publish command to Redis channel that the Robot is listening to
                    # The particular robot may be connected to this instance or another, but whatever instance it is,
                    # it is listenig to this channel
                    await self.pub_redis.publish(f"commands:{robot_id}", data)

        except Exception as e:
            # logger.error(f"User disconnected: {e}")
            await self.disconnect(robot_id, "user", websocket)

    async def listen_to_redis(self):
        """
        Background task: Listens to ALL Redis channels.
        - If message on 'state:{robot_id}': Broadcast to local Users.
        - If message on 'commands:{robot_id}': Send to local Robot.
        """
        psub = self.sub_redis.pubsub()
        await psub.psubscribe("state:*", "commands:*")

        async for msg in psub.listen():
            if msg["type"] != "pmessage":
                continue
            
            channel = msg["channel"]
            payload = msg["data"]
            
            # channel is like "state:robot_01" or "commands:robot_01"
            prefix, robot_id = channel.split(":", 1)

            if prefix == "state":
                # Broadcast to all users connected to THIS server instance watching this robot
                if robot_id in self.active_user_connections:
                    # Copy list to avoid concurrent modification issues
                    for ws in self.active_user_connections[robot_id][:]:
                        try:
                            await ws.send_text(payload)
                        except:
                            # Stale connection
                            pass
                            
            elif prefix == "commands":
                # Forward to the Robot if it is connected to THIS server instance
                if robot_id in self.active_robot_connections:
                    ws = self.active_robot_connections[robot_id]
                    try:
                        await ws.send_text(payload)
                    except:
                        pass

socket_manager = SocketManager()