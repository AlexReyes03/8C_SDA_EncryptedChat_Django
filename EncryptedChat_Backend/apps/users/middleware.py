from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from urllib.parse import parse_qs


@database_sync_to_async
def get_user(user_id: int):
    try:
        return get_user_model().objects.get(id=user_id)
    except get_user_model().DoesNotExist:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Allow pass token in query string (e.g. ?token=xxxxx)
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if not token:
            # Fallback to headers
            headers = dict(scope.get("headers", {}))
            if b"authorization" in headers:
                try:
                    auth_header = headers[b"authorization"].decode()
                    if auth_header.startswith("Bearer "):
                        token = auth_header.split(" ")[1]
                except Exception:
                    pass

        if token:
            try:
                UntypedToken(token)
                decoded_data = jwt_decode(
                    token, settings.SECRET_KEY, algorithms=["HS256"]
                )
                scope["user"] = await get_user(decoded_data["user_id"])
            except (InvalidToken, TokenError, Exception):
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Apply this middleware to wrap the WebSockets ASGI application.
    """
    from channels.sessions import CookieMiddleware
    from channels.sessions import SessionMiddleware

    return CookieMiddleware(SessionMiddleware(JWTAuthMiddleware(inner)))
