import json
import time
import uuid
from typing import List

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

from .models import Room, Message

User = get_user_model()

CHAT_GROUP_NAME = "chat_general"
HISTORY_LIMIT = 50


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        self.last_message_time = 0

        # Join the general chat group
        await self.channel_layer.group_add(CHAT_GROUP_NAME, self.channel_name)
        await self.accept()

        # Send welcome with message history
        room = await self.get_or_create_general_room()
        history = await self.get_recent_messages(room, limit=HISTORY_LIMIT)
        await self.send(
            json.dumps(
                {
                    "type": "welcome",
                    "history": [
                        {
                            "id": f"msg-{msg.id}",
                            "type": "chat",
                            "apodo": msg.sender.username,
                            "message": msg.encrypted_content,
                            "timestamp": msg.created_at.isoformat() + "Z",
                        }
                        for msg in history
                    ],
                }
            )
        )

        # Broadcast user_joined to all in the group
        await self.channel_layer.group_send(
            CHAT_GROUP_NAME,
            {
                "type": "user_joined_event",
                "id": f"evt-{uuid.uuid4()}",
                "apodo": self.user.username,
            },
        )

        print(f"[WebSocket] Connected: {self.user.username} (ID: {self.user.id})")

    async def disconnect(self, close_code):
        if hasattr(self, "user") and not self.user.is_anonymous:
            # Broadcast user_left before leaving
            await self.channel_layer.group_send(
                CHAT_GROUP_NAME,
                {
                    "type": "user_left_event",
                    "id": f"evt-{uuid.uuid4()}",
                    "apodo": self.user.username,
                },
            )
            print(f"[WebSocket] Disconnected: {self.user.username}")

        await self.channel_layer.group_discard(CHAT_GROUP_NAME, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """
        Receives messages from the frontend.
        Expected JSON: { "type": "chat", "message": "..." }
        """
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(json.dumps({"error": "Invalid JSON format"}))
            return

        # Rate limiting
        current_time = time.time()
        if current_time - self.last_message_time < 1:
            await self.send(
                json.dumps({"error": "SPAM_DETECTED", "message": "Pace your messages"})
            )
            return

        msg_type = data.get("type")
        message_content = data.get("message")

        if msg_type != "chat":
            await self.send(json.dumps({"error": "Unknown type"}))
            return

        if not message_content:
            await self.send(json.dumps({"error": "Missing message"}))
            return

        self.last_message_time = current_time

        room = await self.get_or_create_general_room()
        message = await self.save_message(room, self.user, message_content)

        # Broadcast to entire group (including sender)
        await self.channel_layer.group_send(
            CHAT_GROUP_NAME,
            {
                "type": "chat_message_event",
                "id": f"msg-{message.id}",
                "apodo": self.user.username,
                "message": message_content,
                "timestamp": message.created_at.isoformat() + "Z",
            },
        )

    async def chat_message_event(self, event):
        """Handler for chat messages broadcast via group_send."""
        await self.send(
            json.dumps(
                {
                    "id": event["id"],
                    "type": "chat",
                    "apodo": event["apodo"],
                    "message": event["message"],
                    "timestamp": event["timestamp"],
                }
            )
        )

    async def user_joined_event(self, event):
        """Handler for user_joined broadcast via group_send."""
        await self.send(
            json.dumps(
                {
                    "id": event["id"],
                    "type": "user_joined",
                    "apodo": event["apodo"],
                }
            )
        )

    async def user_left_event(self, event):
        """Handler for user_left broadcast via group_send."""
        await self.send(
            json.dumps(
                {
                    "id": event["id"],
                    "type": "user_left",
                    "apodo": event["apodo"],
                }
            )
        )

    @database_sync_to_async
    def get_or_create_general_room(self) -> Room:
        room, _ = Room.objects.get_or_create(
            is_group=True,
            name="General",
        )
        return room

    @database_sync_to_async
    def get_recent_messages(self, room: Room, limit: int = 50) -> List[Message]:
        return list(
            Message.objects.filter(room=room).select_related("sender").order_by("-created_at")[:limit]
        )[::-1]

    @database_sync_to_async
    def save_message(self, room: Room, sender, encrypted_content: str) -> Message:
        return Message.objects.create(
            room=room, sender=sender, encrypted_content=encrypted_content
        )
