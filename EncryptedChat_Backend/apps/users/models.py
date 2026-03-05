from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # AbstractUser gives us username, first_name, last_name, email, password
    # We can add a simple profile picture or bio if needed in the future
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "auth_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self) -> str:
        return self.username
