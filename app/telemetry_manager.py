import asyncio
import json
import logging
import traceback
from typing import Dict, List
from fastapi import WebSocket
import redis.asyncio as redis
import os
from nf_robot.generated.nf import telemetry, control, common

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
        # One connection for publishing binary telemetry
        self.pub_redis = redis.from_url(self.redis_url, decode_responses=False)
        # Separate connection for subscribing (blocking)
        self.sub_redis = redis.from_url(self.redis_url, decode_responses=False)
        # Third connection for regular keys
        self.decoding_redis = redis.from_url(self.redis_url, decode_responses=True)
        
        # Ping to ensure connectivity at startup
        await self.pub_redis.ping()
        await self.sub_redis.ping()
        
        self.listen_task = asyncio.create_task(self.listen_to_redis())
        logger.info(f"TelemetryManager initialized. Listener task started.")

    async def disconnect(self, robot_id: str, client_type: str, websocket: WebSocket = None):
        if client_type == "robot":
            self.active_robot_connections.pop(robot_id, None)
        else:
            connections = self.active_user_connections.get(robot_id, [])
            if websocket in connections:
                connections.remove(websocket)

    async def mark_robot_online(self, robot_id: str, online: bool):
        await self.decoding_redis.hset(f"robot:{robot_id}:uplink_state", 'online', 'true' if online else 'false')
        # publish a serialized batch update for all connected clients announcing that this robot is offline
        batch = telemetry.TelemetryBatchUpdate(
            robot_id=robot_id,
            updates=[telemetry.TelemetryItem(uplink_status=telemetry.UplinkStatus(online=online))],
        )
        await self.pub_redis.publish(f"state:{robot_id}", bytes(batch))

    async def handle_robot_connection(self, websocket: WebSocket, robot_id: str):
        """
        Logic for the Physical Robot connecting to Cloud.
        Every message on the websocket will be a serialized TelemetryBatchUpdate
        Every message sent must be a serialized ControlBatchUpdate
        """
        self.active_robot_connections[robot_id] = websocket
        await self.mark_robot_online(robot_id, True)

        try:
            while True:
                data = await websocket.receive_bytes()
                # Robot sends its state, put on redis channel for this robot. (already serialized data)
                # We publish this to Redis so all web servers can forward it to UI's connected to this robot.
                await self.pub_redis.publish(f"state:{robot_id}", data)
                
                # deserialize and look for retain_key in any TelemetryItems
                batch = telemetry.TelemetryBatchUpdate().parse(data)
                for item in batch.updates:
                    if item.retain_key is not None:
                        # retain this item at this key
                        await self.pub_redis.hset(
                            f"robot:{robot_id}:retained", 
                            item.retain_key, 
                            bytes(item) # serialized item
                        )
        except Exception as e:
            logger.error(f"Robot {robot_id} connection lost: {e}")
            raise e
        finally:
            await self.disconnect(robot_id, "robot")
            await self.mark_robot_online(robot_id, False)


    async def handle_user_connection(self, websocket: WebSocket, robot_id: str, user_id: str):
        """
        Logic for a Browser User connecting with a web UI to control or spectate a given robot
        1. Any messages received on websocket are ControlBatchUpdate
        2. Check permissions (Is Owner? Is Playroom Driver?).
        3. Publish Command to Redis so connected robot receives it. (it may be connected to a different server)
        """
        if robot_id not in self.active_user_connections:
            self.active_user_connections[robot_id] = []
        self.active_user_connections[robot_id].append(websocket)

        try:
            startup_batch = await self.get_startup_state(robot_id)
            if startup_batch is not None:
                await websocket.send_bytes(startup_batch)

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

    async def get_startup_state(self, robot_id: str) -> bytes:
        """
        Fetch all retained messages for a robot to send to a new UI.
        Returns bytes of a TelemetryBatchUpdate.
        """

        # always send an UplinkStatus about whether the robot is connected to the control_plane
        online = False
        up_status = await self.decoding_redis.hgetall(f"robot:{robot_id}:uplink_state")
        if up_status and 'online' in up_status:
            online = up_status['online'] == 'true'
        startup_items = [telemetry.TelemetryItem(uplink_status=telemetry.UplinkStatus(online=online))]

        # If it's online, send all the retained UI startup messages
        if online:
            # HGETALL returns a dict {field_bytes: value_bytes}
            # This is a single atomic operation.
            retained_raw = await self.pub_redis.hgetall(f"robot:{robot_id}:retained")
            if retained_raw:
                for raw_item_bytes in retained_raw.values():
                    # We stored the 'TelemetryItem' bytes
                    item = telemetry.TelemetryItem().parse(raw_item_bytes)
                    startup_items.append(item)

        # Construct the batch update
        batch = telemetry.TelemetryBatchUpdate(
            robot_id=robot_id,
            updates=startup_items
        )
        
        return bytes(batch)

    async def listen_to_redis(self):
        """
        Background task with automatic reconnection logic to listen to robot state channel and
        filter for bots that are connected to this instance.
        """
        retry_delay = 1
        while True:
            try:
                psub = self.sub_redis.pubsub()
                async with psub as p:
                    await p.psubscribe("state:*", "commands:*")
                    logger.info("Redis Pub/Sub listener subscribed to channels.")
                    
                    # Reset delay on successful subscription
                    retry_delay = 1 

                    async for msg in p.listen():
                        if msg["type"] != "pmessage":
                            continue
                        
                        channel = msg["channel"].decode("utf-8")
                        payload = msg["data"]
                        prefix, robot_id = channel.split(":", 1)

                        if prefix == "state":
                            if robot_id in self.active_user_connections:
                                for ws in self.active_user_connections[robot_id][:]:
                                    try:
                                        await ws.send_bytes(payload)
                                    except Exception:
                                        # Stale WS, cleanup handled by handle_user_connection
                                        pass
                                        
                        elif prefix == "commands":
                            if robot_id in self.active_robot_connections:
                                ws = self.active_robot_connections[robot_id]
                                try:
                                    await ws.send_bytes(payload)
                                except Exception:
                                    pass

            except Exception:
                # Log full traceback to identify why the listener died
                logger.error(f"Telemetry listener crashed. Retrying in {retry_delay}s...\n{traceback.format_exc()}")
                await asyncio.sleep(retry_delay)
                # Exponential backoff to avoid hammering Redis during an outage
                retry_delay = min(retry_delay * 2, 60)

telemetry_manager = TelemetryManager()