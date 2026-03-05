from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.security.models import PublicKey

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")
        read_only_fields = ("id",)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    public_key = serializers.CharField(
        write_only=True, required=True, help_text="PEM formatted RSA Public Key"
    )

    class Meta:
        model = User
        fields = ("username", "email", "password", "public_key")

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
