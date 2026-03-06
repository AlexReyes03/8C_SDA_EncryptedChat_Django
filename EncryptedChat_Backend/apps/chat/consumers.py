import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from typing import Dict, Any
from .models import Room, Message, Group, GroupMember
import time

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            # Reject connection if not authenticated via JWT
            await self.close()
            return

        self.user_room_name = f"user_{self.user.id}"
        self.last_message_time = 0
        self.active_group_id = None # Current active group the user is focused on

        await self.channel_layer.group_add(self.user_room_name, self.channel_name)
        await self.accept()
        print(f"[WebSocket] Connected: {self.user.username} (ID: {self.user.id})")

    async def disconnect(self, close_code):
        if hasattr(self, "user_room_name"):
            await self.channel_layer.group_discard(
                self.user_room_name, self.channel_name
            )
        if hasattr(self, "active_group_id") and self.active_group_id:
             await self.channel_layer.group_discard(
                 f"group_{self.active_group_id}", self.channel_name
             )
        print(f"[WebSocket] Disconnected: {self.user.username}")

    async def receive(self, text_data=None, bytes_data=None):
        """
        Receives messages from the client (Frontend).
        Expected JSON format for sending a message:
        {
            "action": "send_message",
            "recipient_id": 2,
            "encrypted_content": "A1B2C3D4...",
            "hash": "..." # (Optional integrity validation from frontend)
        }
        """
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(json.dumps({"error": "Invalid JSON format"}))
            return

        # Simple rate limiting (Anti-spam)
        current_time = time.time()
        if current_time - self.last_message_time < 1:  # 1 message per second
            await self.send(
                json.dumps({"error": "SPAM_DETECTED", "message": "Pace your messages"})
            )
            return

        action = data.get("action")

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
            {
                "type": "chat_message",
                "message_id": message.id,
                "sender_id": self.user.id,
                "sender_username": self.user.username,
                "room_id": room.id,
                "encrypted_content": encrypted_content,
                "timestamp": str(message.created_at),
            },
        )

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

        await self.send(
            json.dumps(
                {
                    "type": "group_history",
                    "group_id": group_id,
                    "messages": result,
                }
            )
        )

    async def chat_message(self, event):
        """
        Handler for messages sent via group_send.
        Sends the message down the WebSocket to the actual client.
        """
        await self.send(
            json.dumps(
                {
                    "type": "incoming_message",
                    "message_id": event["message_id"],
                    "sender_id": event["sender_id"],
                    "sender_username": event["sender_username"],
                    "room_id": event["room_id"],
                    "encrypted_content": event["encrypted_content"],
                    "timestamp": event["timestamp"],
                }
            )
        )

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

    @database_sync_to_async
    def save_message(self, room, sender, encrypted_content):
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
