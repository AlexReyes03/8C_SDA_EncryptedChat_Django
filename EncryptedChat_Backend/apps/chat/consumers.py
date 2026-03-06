import json
import time
import uuid
from typing import List, Dict, Any

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

from .models import Room, Message, Group, GroupMember

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
        self.active_group_id = None  # Grupo activo actual del usuario

        # Unirse al canal general (para eventos de sistema como user_joined/user_left)
        await self.channel_layer.group_add(CHAT_GROUP_NAME, self.channel_name)
        await self.accept()

        # Broadcast user_joined a todos
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
            # Broadcast user_left antes de salir
            await self.channel_layer.group_send(
                CHAT_GROUP_NAME,
                {
                    "type": "user_left_event",
                    "id": f"evt-{uuid.uuid4()}",
                    "apodo": self.user.username,
                },
            )

        # Desuscribirse del grupo activo si existe
        if hasattr(self, "active_group_id") and self.active_group_id:
            await self.channel_layer.group_discard(
                f"group_{self.active_group_id}", self.channel_name
            )

        await self.channel_layer.group_discard(CHAT_GROUP_NAME, self.channel_name)
        print(f"[WebSocket] Disconnected: {self.user.username}")

    async def receive(self, text_data=None, bytes_data=None):
        """
        Recibe mensajes del frontend.
        Formato esperado: { "action": "send_message" | "get_group_history", ... }
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

        # Guardar el mensaje en la Base de Datos
        message = await self.save_message(room, self.user, encrypted_content)

        # Broadcast del mensaje via Channels al grupo
        group_channel_name = f"group_{group_id}"
        await self.channel_layer.group_send(
            group_channel_name,
            {
                "type": "chat_message_event",
                "message_id": message.id,
                "sender_username": self.user.username,
                "encrypted_content": encrypted_content,
                "timestamp": message.created_at.isoformat() + "Z",
            },
        )

    async def handle_get_group_history(self, data: Dict[str, Any]):
        """
        Devuelve el historial de mensajes de un grupo.
        Solo si el usuario es miembro aceptado del grupo.
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

        # Suscribir al usuario al canal del grupo solo si la verificacion de membresia fue exitosa
        if self.active_group_id:
            await self.channel_layer.group_discard(
                f"group_{self.active_group_id}", self.channel_name
            )

        self.active_group_id = group_id
        await self.channel_layer.group_add(f"group_{group_id}", self.channel_name)

        # Enviar historial al usuario
        await self.send(
            json.dumps(
                {
                    "type": "group_history",
                    "messages": result,
                }
            )
        )

    # ---- Channel Layer Event Handlers ----

    async def chat_message_event(self, event):
        """Handler para mensajes de chat broadcast via group_send."""
        await self.send(
            json.dumps(
                {
                    "type": "incoming_message",
                    "message_id": event["message_id"],
                    "sender_username": event["sender_username"],
                    "encrypted_content": event["encrypted_content"],
                    "timestamp": event["timestamp"],
                }
            )
        )

    async def user_joined_event(self, event):
        """Handler para user_joined broadcast via group_send."""
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
        """Handler para user_left broadcast via group_send."""
        await self.send(
            json.dumps(
                {
                    "id": event["id"],
                    "type": "user_left",
                    "apodo": event["apodo"],
                }
            )
        )

    # ---- Operaciones sincronas de DB envueltas para compatibilidad async ----

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
    def get_or_create_general_room(self) -> Room:
        room, _ = Room.objects.get_or_create(
            is_group=True,
            name="General",
        )
        return room

    @database_sync_to_async
    def get_recent_messages(self, room: Room, limit: int = 50) -> List[Message]:
        return list(
            Message.objects.filter(room=room)
            .select_related("sender")
            .order_by("-created_at")[:limit]
        )[::-1]

    @database_sync_to_async
    def save_message(self, room: Room, sender, encrypted_content: str) -> Message:
        return Message.objects.create(
            room=room, sender=sender, encrypted_content=encrypted_content
        )

    @database_sync_to_async
    def get_group_history_messages(self, group_id, user):
        """
        Retorna lista de diccionarios de mensajes para la sala del grupo
        si el usuario es un miembro aceptado.
        Retorna None si el grupo no existe o el usuario no es miembro aceptado.
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
