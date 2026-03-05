"""
ASGI config for EncryptedChat_Backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.users.middleware import JWTAuthMiddlewareStack
import apps.chat.routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "EncryptedChat_Backend.settings")

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(apps.chat.routing.websocket_urlpatterns)
        ),
    }
)
