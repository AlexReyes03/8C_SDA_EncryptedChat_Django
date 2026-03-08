from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import PublicKey


class PublicKeyView(APIView):
    """
    POST: Registra o actualiza la llave pública del usuario autenticado.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        key_data = request.data.get("key_data")
        encrypted_private_key = request.data.get("encrypted_private_key")

        if not key_data:
            return Response(
                {"detail": "key_data is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        defaults = {"key_data": key_data}
        if encrypted_private_key is not None:
            defaults["encrypted_private_key"] = encrypted_private_key
        
        # Guardar o actualizar la llave pública del usuario
        public_key, created = PublicKey.objects.update_or_create(
            user=request.user,
            defaults=defaults
        )

        return Response(
            {
                "user_id": public_key.user.id,
                "key_data": public_key.key_data,
                "encrypted_private_key": public_key.encrypted_private_key,
                "created": created
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def get(self, request):
        try:
            public_key = PublicKey.objects.get(user=request.user)
            return Response(
                {
                    "user_id": public_key.user.id,
                    "key_data": public_key.key_data,
                    "encrypted_private_key": public_key.encrypted_private_key
                },
                status=status.HTTP_200_OK
            )
        except PublicKey.DoesNotExist:
            return Response(
                {"detail": "Public key not found. Please upload one."},
                status=status.HTTP_404_NOT_FOUND
            )


class PublicKeyDetailView(APIView):
    """
    GET: Recupera la llave pública de otro usuario (ej. para encriptar la llave AES al invitarlo o aceptarlo en un grupo).
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, user_id):
        try:
            public_key = PublicKey.objects.get(user_id=user_id)
        except PublicKey.DoesNotExist:
            return Response(
                {"detail": "Public key not found for this user."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        return Response(
            {
                "user_id": public_key.user.id,
                "key_data": public_key.key_data
            },
            status=status.HTTP_200_OK
        )
