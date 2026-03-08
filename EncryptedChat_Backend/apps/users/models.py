from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class AllowedSpacesUsernameValidator(RegexValidator):
    regex = r"^[\w.@+ -]+$"
    message = "Ingrese un nombre de usuario válido. Este puede contener sólo letras, números, espacios y caracteres @/./+/-/_."
    flags = 0


class User(AbstractUser):
    username_validator = AllowedSpacesUsernameValidator()

    username = models.CharField(
        "username",
        max_length=150,
        unique=True,
        help_text="Requerido. 150 caracteres o menos. Letras, dígitos, espacios y @/./+/-/_ permitidos.",
        validators=[username_validator],
        error_messages={
            "unique": "Ya existe un usuario con ese nombre.",
        },
    )

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
