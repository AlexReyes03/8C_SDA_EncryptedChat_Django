from django.contrib import admin
from .models import Room, Message, Group, GroupMember


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "invite_code", "max_participants", "is_private", "created_at")
    list_filter = ("is_private",)
    search_fields = ("name", "invite_code")


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ("group", "user", "role", "status", "joined_at")
    list_filter = ("role", "status")
    search_fields = ("user__username", "group__name")


admin.site.register(Room)
admin.site.register(Message)
