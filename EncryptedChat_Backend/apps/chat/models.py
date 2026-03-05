from django.db import models
from django.conf import settings


class Room(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="rooms"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_room"

    def __str__(self) -> str:
        if self.is_group and self.name:
            return self.name
        return f"Direct Room {self.id}"


class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    # This will hold the encrypted payload. It's opaque to the server.
    encrypted_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_message"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Ej Message from {self.sender.username} in Room {self.room.id}"
