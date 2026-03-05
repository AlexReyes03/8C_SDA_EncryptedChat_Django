import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from typing import Dict, Any
from .models import Room, Message
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

        # Create a personal channel group for this user
        # This is where we will route direct messages meant for them
        await self.channel_layer.group_add(self.user_room_name, self.channel_name)

        await self.accept()
        print(f"[WebSocket] Connected: {self.user.username} (ID: {self.user.id})")

        # Optionally broadcast a "User is online" status...

    async def disconnect(self, close_code):
        if hasattr(self, "user_room_name"):
            await self.channel_layer.group_discard(
                self.user_room_name, self.channel_name
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
        else:
            await self.send(json.dumps({"error": "Unknown action"}))

    async def handle_send_message(self, data: Dict[str, Any]):
        recipient_id = data.get("recipient_id")
        encrypted_content = data.get("encrypted_content")

        if not recipient_id or not encrypted_content:
            await self.send(
                json.dumps({"error": "Missing recipient_id or encrypted_content"})
            )
            return

        recipient = await self.get_user(recipient_id)
        if not recipient:
            await self.send(json.dumps({"error": "Recipient not found"}))
            return

        # Get or create the Direct Message Room
        room = await self.get_or_create_dm_room(self.user, recipient)

        # Save the message to the Database (opaque to server)
        message = await self.save_message(room, self.user, encrypted_content)

        # Broadcast the message via Channels to the recipient's personal group
        recipient_group_name = f"user_{recipient.id}"
        await self.channel_layer.group_send(
            recipient_group_name,
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

        # Also echo back to the sender so their UI can add it to the chat log
        # if they have multiple devices or just for confirmation.
        await self.send(
            json.dumps(
                {"type": "message_sent_ack", "message_id": message.id, "status": "ok"}
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
    def get_or_create_dm_room(self, user1, user2):
        # A simple way to handle DM rooms is to look for a non-group room
        # that has exactly these two participants.
        rooms = Room.objects.filter(is_group=False, participants=user1).filter(
            participants=user2
        )
        if rooms.exists():
            return rooms.first()
        else:
            room = Room.objects.create(is_group=False)
            room.participants.add(user1, user2)
            return room

    @database_sync_to_async
    def save_message(self, room, sender, encrypted_content):
        return Message.objects.create(
            room=room, sender=sender, encrypted_content=encrypted_content
        )
