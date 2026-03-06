from django.urls import path
from . import views

urlpatterns = [
    path("", views.GroupListCreateView.as_view(), name="group-list-create"),
    path("join/", views.GroupJoinView.as_view(), name="group-join"),
    path("me/", views.GroupMeView.as_view(), name="group-me"),
    path("<int:pk>/roles/", views.GroupRolesView.as_view(), name="group-roles"),
    path("<int:pk>/requests/", views.GroupRequestsView.as_view(), name="group-requests"),
]
