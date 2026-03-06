import re

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.security.models import PublicKey

User = get_user_model()

# Formatos aceptados para clave pública:
# - OpenSSH: ssh-rsa AAAAB3NzaC1yc... (comentario opcional)
# - PEM: -----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----
OPENSSH_PUBLIC_KEY_PATTERN = re.compile(
    r"^ssh-rsa\s+[A-Za-z0-9+/=]+\s*(?:\([^)]*\)|.*)?$",
    re.DOTALL,
)
PEM_PUBLIC_KEY_PATTERN = re.compile(
    r"^-----BEGIN PUBLIC KEY-----\s*.+?\s*-----END PUBLIC KEY-----\s*$",
    re.DOTALL,
)
PUBLIC_KEY_MAX_LENGTH = 2048


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")
        read_only_fields = ("id",)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        style={"input_type": "password"},
    )
    email = serializers.EmailField(required=True)
    public_key = serializers.CharField(
        write_only=True,
        required=True,
        max_length=PUBLIC_KEY_MAX_LENGTH,
        help_text="Clave pública en formato OpenSSH (ssh-rsa AAAAB3...) o PEM",
    )

    class Meta:
        model = User
        fields = ("username", "email", "password", "public_key")

    def validate_public_key(self, value):
        value = value.strip()
        if not (OPENSSH_PUBLIC_KEY_PATTERN.match(value) or PEM_PUBLIC_KEY_PATTERN.match(value)):
            raise serializers.ValidationError(
                "La clave pública debe estar en formato OpenSSH (ssh-rsa AAAAB3...) "
                "o PEM (-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----)"
            )
        return value

    def create(self, validated_data: dict) -> User:
        public_key_data = validated_data.pop("public_key")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )

        # Save the public key associated with the user
        PublicKey.objects.create(user=user, key_data=public_key_data)

        return user
