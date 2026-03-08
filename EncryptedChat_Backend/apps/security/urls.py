from django.urls import path
from .views import PublicKeyView, PublicKeyDetailView

urlpatterns = [
    path("keys/", PublicKeyView.as_view(), name="public-key-list-create"),
    path("keys/<int:user_id>/", PublicKeyDetailView.as_view(), name="public-key-detail"),
]
