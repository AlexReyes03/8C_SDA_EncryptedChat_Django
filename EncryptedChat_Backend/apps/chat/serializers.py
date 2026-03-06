from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, GroupMember, Room

User = get_user_model()


class GroupMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all()
    )
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = GroupMember
        fields = ("id", "user_id", "username", "role", "status", "joined_at")
        read_only_fields = ("id", "joined_at")


class GroupSerializer(serializers.ModelSerializer):
    invite_code = serializers.CharField(read_only=True)
    room_id = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    membership = serializers.SerializerMethodField()

    def get_room_id(self, obj):
        return obj.room_id if obj.room_id else None

    class Meta:
        model = Group
        fields = (
            "id",
            "name",
            "invite_code",
            "max_participants",
            "is_private",
            "room_id",
            "members_count",
            "membership",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "invite_code", "room_id", "created_at", "updated_at")

    def get_members_count(self, obj):
        return obj.members.filter(status=GroupMember.Status.ACCEPTED).count()

    def get_membership(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        
        if hasattr(obj, 'user_membership'):
            membership = obj.user_membership[0] if obj.user_membership else None
        else:
            membership = obj.members.filter(user=request.user).first()
            
        if membership:
            return {
                "role": membership.role,
                "status": membership.status
            }
        return None


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ("name", "max_participants", "is_private")

    def validate_max_participants(self, value):
        if value < 2 or value > 500:
            raise serializers.ValidationError(
                "max_participants must be between 2 and 500."
            )
        return value


class GroupJoinSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=32, trim_whitespace=True)


class GroupRolesSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    new_role = serializers.ChoiceField(choices=GroupMember.Role.choices)
    demote_self = serializers.BooleanField(default=False)


class GroupRequestsSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    accept = serializers.BooleanField()
