from django.db import models
from django.conf import settings


class PublicKey(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="public_key"
    )
    # RSA keys can be long, so TextField is better than CharField
    key_data = models.TextField(help_text="PEM formatted RSA Public Key")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "security_public_key"
        verbose_name = "Public Key"
        verbose_name_plural = "Public Keys"

    def __str__(self) -> str:
        return f"Public Key for {self.user.username}"
