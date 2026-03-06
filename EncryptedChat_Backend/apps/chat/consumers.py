import json
import time
import uuid
from typing import List

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from typing import Dict, Any
from .models import Room, Message, Group, GroupMember
import time

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
        self.active_group_id = None # Current active group the user is focused on

<<<<<<< HEAD
        # Join the general chat group
        await self.channel_layer.group_add(CHAT_GROUP_NAME, self.channel_name)
=======
        await self.channel_layer.group_add(self.user_room_name, self.channel_name)
>>>>>>> frontend
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
        if hasattr(self, "active_group_id") and self.active_group_id:
             await self.channel_layer.group_discard(
                 f"group_{self.active_group_id}", self.channel_name
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

<<<<<<< HEAD
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
=======
        if action == "send_message":
            self.last_message_time = current_time
            await self.handle_send_message(data)
        elif action == "get_group_history":
            await self.handle_get_group_history(data)
        else:
            await self.send(json.dumps({"error": "Unknown action"}))

    async def handle_send_message(self, data: Dict[str, Any]):
        group_id = data.get("group_id")
        encrypted_content = data.get("encrypted_content")

        if not group_id or not encrypted_content:
            await self.send(
                json.dumps({"error": "Missing group_id or encrypted_content"})
            )
            return

        room = await self.get_room_from_group(group_id, self.user)
        if not room:
             await self.send(json.dumps({"error": "Forbidden or group not found"}))
             return

        # Save the message to the Database
        message = await self.save_message(room, self.user, encrypted_content)

        # Broadcast the message via Channels to the Group room
        group_channel_name = f"group_{group_id}"
        await self.channel_layer.group_send(
            group_channel_name,
>>>>>>> frontend
            {
                "type": "chat_message_event",
                "id": f"msg-{message.id}",
                "apodo": self.user.username,
                "message": message_content,
                "timestamp": message.created_at.isoformat() + "Z",
            },
        )

<<<<<<< HEAD
    async def chat_message_event(self, event):
        """Handler for chat messages broadcast via group_send."""
=======
    async def handle_get_group_history(self, data: Dict[str, Any]):
        """
        Welcome data: return message history for a group.
        Only if the user is an accepted member of the group.
        """
        group_id = data.get("group_id")
        if group_id is None:
            await self.send(json.dumps({"error": "Missing group_id"}))
            return

        result = await self.get_group_history_messages(group_id, self.user)
        if result is None:
            await self.send(
                json.dumps(
                    {
                        "error": "FORBIDDEN",
                        "message": "Not an accepted member of this group or group not found.",
                    }
                )
            )
            return
            
        # Suscribe user to the group's channel layer strictly only if member verification succeeded
        if self.active_group_id:
             await self.channel_layer.group_discard(
                 f"group_{self.active_group_id}", self.channel_name
             )
        
        self.active_group_id = group_id
        await self.channel_layer.group_add(f"group_{group_id}", self.channel_name)

>>>>>>> frontend
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

<<<<<<< HEAD
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
=======
    # Synchronous DB operations wrapped to be async-friendly

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_room_from_group(self, group_id, user):
        try:
            group = Group.objects.get(pk=group_id)
            is_accepted = GroupMember.objects.filter(
                group=group,
                user=user,
                status=GroupMember.Status.ACCEPTED,
            ).exists()
            if is_accepted:
                return group.room
        except Group.DoesNotExist:
            pass
        return None
>>>>>>> frontend

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

    @database_sync_to_async
    def get_group_history_messages(self, group_id, user):
        """
        Return list of message dicts for the group's room if user is an accepted member.
        Returns None if group not found or user is not an accepted member.
        """
        try:
            group = Group.objects.get(pk=group_id)
        except Group.DoesNotExist:
            return None
        if not group.room_id:
            return []
        is_accepted = GroupMember.objects.filter(
            group=group,
            user=user,
            status=GroupMember.Status.ACCEPTED,
        ).exists()
        if not is_accepted:
            return None
        messages = Message.objects.filter(room_id=group.room_id).order_by("created_at")
        return [
            {
                "message_id": m.id,
                "sender_id": m.sender_id,
                "sender_username": m.sender.username,
                "room_id": m.room_id,
                "encrypted_content": m.encrypted_content,
                "timestamp": str(m.created_at),
            }
            for m in messages
        ]
