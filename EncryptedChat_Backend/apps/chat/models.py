import random
import string
from django.db import models
from django.conf import settings


def generate_invite_code():
    """Generate a unique invite code like ABC-1234."""
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    digits = "".join(random.choices(string.digits, k=4))
    return f"{letters}-{digits}"


class Group(models.Model):
    name = models.CharField(max_length=255)
    invite_code = models.CharField(max_length=32, unique=True, db_index=True)
    max_participants = models.IntegerField(default=50)
    is_private = models.BooleanField(default=False)
    server_encrypted_aes_key = models.TextField(null=True, blank=True)
    room = models.OneToOneField(
        "Room",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="group",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_group"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.invite_code:
            while True:
                code = generate_invite_code()
                if not Group.objects.filter(invite_code=code).exists():
                    self.invite_code = code
                    break
        super().save(*args, **kwargs)


class GroupMember(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"

    group = models.ForeignKey(
        Group, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_memberships"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Store the group's symmetric AES key, encrypted with this user's public RSA key.
    encrypted_symmetric_key = models.TextField(null=True, blank=True)
    
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_group_member"
        unique_together = [["group", "user"]]

    def __str__(self):
        return f"{self.user.username} in {self.group.name} ({self.role})"


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
