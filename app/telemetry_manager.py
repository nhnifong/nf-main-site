import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket
import redis.asyncio as redis
import os
from .generated.nf import telemetry, control, common

from .queue_manager import queue_manager

logger = logging.getLogger(__name__)

class TelemetryManager:
    """
    Handles WebSocket connections from robots and Redis Pub/Sub routing.
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
        self.pub_redis = redis.from_url(self.redis_url, decode_responses=False)
        # Separate connection for subscribing (blocking)
        self.sub_redis = redis.from_url(self.redis_url, decode_responses=False)
        
        try:
            await self.pub_redis.ping()
            await self.sub_redis.ping()
        except Exception as e:
            logger.error(f"Could not connect to Redis at {self.redis_url}")
            raise e
        
        # Start background listener
        self.listen_task = asyncio.create_task(self.listen_to_redis())
        logger.info("TelemetryManager connected to Redis")

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
        Every message on the websocket will be a serialized TelemetryBatchUpdate
        Every message sent must be a serialized ControlBatchUpdate
        """
        self.active_robot_connections[robot_id] = websocket
        try:
            while True:
                data = await websocket.receive_bytes()
                batch = telemetry.TelemetryBatchUpdate().parse(data)
                # Robot sends its state. leave it seralized.
                # We publish this to Redis so all web servers can forward it to UI's connected to this robot.
                await self.pub_redis.publish(f"state:{robot_id}", data)
        except Exception as e:
            logger.error(f"Robot {robot_id} connection lost: {e}")
            await self.disconnect(robot_id, "robot")
            raise e

    async def handle_user_connection(self, websocket: WebSocket, robot_id: str, user_id: str):
        """
        Logic for a Browser User connecting with a web UI to control or spectact a given robot
        1. Any messages received on websocket are ControlBatchUpdate
        2. Check permissions (Is Owner? Is Playroom Driver?).
        3. Publish Command to Redis so connected robot receives it. (it may be connected to a different server)
        """
        if robot_id not in self.active_user_connections:
            self.active_user_connections[robot_id] = []
        self.active_user_connections[robot_id].append(websocket)

        try:
            while True:
                # data is a serialized ControlBatchUpdate. leave it serialized
                data = await websocket.receive_bytes()
                
                # --- PERMISSION CHECK ---
                # 1. Is it a private robot? (Check DB owner) -> Allow
                # 2. Is it a public demo? (Check Queue)
                is_allowed = False
                
                # assume public demo logic if robot_id starts with 'playroom'
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
                    await self.pub_redis.publish(f"commands:{robot_id}", data)

        except Exception as e:
            logger.error(f"User disconnected: {e}")
            await self.disconnect(robot_id, "user", websocket)

    async def listen_to_redis(self):
        """
        Background task: Listens to both state and commands Redis channels.
        - If message on 'state:{robot_id}': Broadcast to local Users.
        - If message on 'commands:{robot_id}': Send to local Robot.
        """
        psub = self.sub_redis.pubsub()
        await psub.psubscribe("state:*", "commands:*")

        async for msg in psub.listen():
            if msg["type"] != "pmessage":
                continue
            
            # decode channel name since it's text
            channel = msg["channel"].decode("utf-8")
            # leave payload as binary (serialized protobuf)
            payload = msg["data"]
            
            # channel is like "state:robot_01" or "commands:robot_01"
            prefix, robot_id = channel.split(":", 1)

            if prefix == "state":
                # Broadcast to all users connected to this server instance watching this robot
                if robot_id in self.active_user_connections:
                    # Copy list to avoid concurrent modification issues
                    for ws in self.active_user_connections[robot_id][:]:
                        try:
                            await ws.send_bytes(payload)
                        except:
                            # Stale connection
                            pass
                            
            elif prefix == "commands":
                # Forward to the Robot if it is connected to this server instance
                if robot_id in self.active_robot_connections:
                    ws = self.active_robot_connections[robot_id]
                    try:
                        await ws.send_bytes(payload)
                    except:
                        pass

telemetry_manager = TelemetryManager()