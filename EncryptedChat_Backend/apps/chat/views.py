from django.db import transaction
from django.db.models import Prefetch
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Group, GroupMember, Room
from .serializers import (
    GroupSerializer,
    GroupCreateSerializer,
    GroupJoinSerializer,
    GroupMemberSerializer,
    GroupRolesSerializer,
    GroupRequestsSerializer,
)


class GroupListCreateView(generics.ListCreateAPIView):
    """
    GET: list groups (filtered to current user's groups for consistency with /me/).
    POST: create a group. Creator becomes admin with status=accepted.
    """
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return GroupCreateSerializer
        return GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(
            members__user=self.request.user,
            members__status=GroupMember.Status.ACCEPTED,
        ).distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = GroupSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = GroupCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            room = Room.objects.create(name=serializer.validated_data["name"], is_group=True)
            group = Group.objects.create(
                name=serializer.validated_data["name"],
                max_participants=serializer.validated_data["max_participants"],
                is_private=serializer.validated_data["is_private"],
                room=room,
            )
            GroupMember.objects.create(
                group=group,
                user=request.user,
                role=GroupMember.Role.ADMIN,
                status=GroupMember.Status.ACCEPTED,
            )
        out_serializer = GroupSerializer(group)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class GroupJoinView(APIView):
    """
    POST: join a group by invite_code.
    Public groups -> status=accepted; private -> status=pending.
    Rejects if group is full (accepted count >= max_participants).
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = GroupJoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite_code = serializer.validated_data["invite_code"].strip().upper()

        group = Group.objects.filter(invite_code=invite_code).first()
        if not group:
            return Response(
                {"detail": "Group not found for this invite code."},
                status=status.HTTP_404_NOT_FOUND,
            )

        accepted_count = group.members.filter(status=GroupMember.Status.ACCEPTED).count()
        if accepted_count >= group.max_participants:
            return Response(
                {"detail": "Group is full."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership, created = GroupMember.objects.get_or_create(
            group=group,
            user=request.user,
            defaults={
                "role": GroupMember.Role.MEMBER,
                "status": GroupMember.Status.ACCEPTED if not group.is_private else GroupMember.Status.PENDING,
            },
        )
        if not created:
            return Response(
                {"detail": "You are already a member or have a pending request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = GroupSerializer(group, context={'request': request}).data
        data["membership"] = {
            "role": membership.role,
            "status": membership.status,
        }
        return Response(data, status=status.HTTP_201_CREATED)


class GroupLeaveView(APIView):
    """
    POST: Leave a group. Deletes the GroupMember association for the request.user.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        group = Group.objects.filter(pk=pk).first()
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
            
        membership = GroupMember.objects.filter(group=group, user=request.user).first()
        if not membership:
            return Response({"detail": "You are not a member of this group."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Optional: prevent leaving if it's the only admin and there are other members
        if membership.role == GroupMember.Role.ADMIN:
            admins_count = group.members.filter(role=GroupMember.Role.ADMIN, status=GroupMember.Status.ACCEPTED).count()
            if admins_count <= 1 and group.members.count() > 1:
                return Response({"detail": "You must transfer your Admin role before leaving, or delete the group instead."}, status=status.HTTP_400_BAD_REQUEST)

        membership.delete()
        
        # If group is empty, delete it
        if group.members.count() == 0:
            group.delete()

        return Response({"detail": "Successfully left the group."}, status=status.HTTP_200_OK)


class GroupMeView(generics.ListAPIView):
    """
    GET: groups the authenticated user belongs to (for sidebar).
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = GroupSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = Group.objects.filter(
            members__user=user,
            members__status=GroupMember.Status.ACCEPTED,
        ).distinct()
        
        return base_qs.prefetch_related(
            Prefetch(
                'members',
                queryset=GroupMember.objects.filter(user=user),
                to_attr='user_membership'
            )
        )

class GroupRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: retrieve a group (must be member)
    PUT/PATCH: update group (must be admin)
    DELETE: delete group (must be admin)
    """
    permission_classes = (IsAuthenticated,)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return GroupCreateSerializer
        return GroupSerializer
        
    def get_queryset(self):
        return Group.objects.filter(
            members__user=self.request.user,
            members__status=GroupMember.Status.ACCEPTED,
        ).distinct()
        
    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            is_admin = GroupMember.objects.filter(
                group=obj, 
                user=request.user, 
                role=GroupMember.Role.ADMIN,
                status=GroupMember.Status.ACCEPTED
            ).exists()
            if not is_admin:
                self.permission_denied(request, message="Only group admins can modify or delete the group.")


class GroupRolesView(APIView):
    """
    PUT: change a member's role (e.g. transfer admin or promote to admin).
    Caller must be admin. Ensures at least one admin remains.
    """
    permission_classes = (IsAuthenticated,)

    def put(self, request, pk):
        group = Group.objects.filter(pk=pk).first()
        if not group:
            return Response(
                {"detail": "Group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        caller = GroupMember.objects.filter(
            group=group,
            user=request.user,
            status=GroupMember.Status.ACCEPTED,
        ).first()
        if not caller or caller.role != GroupMember.Role.ADMIN:
            return Response(
                {"detail": "Only group admins can change roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GroupRolesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data["user_id"]
        new_role = serializer.validated_data["new_role"]
        demote_self = serializer.validated_data.get("demote_self", False)

        target = GroupMember.objects.filter(
            group=group,
            user_id=user_id,
            status=GroupMember.Status.ACCEPTED,
        ).first()
        if not target:
            return Response(
                {"detail": "User is not an accepted member of this group."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            admins_count = group.members.filter(
                role=GroupMember.Role.ADMIN,
                status=GroupMember.Status.ACCEPTED,
            ).count()
            if target.role == GroupMember.Role.ADMIN and new_role == GroupMember.Role.MEMBER and admins_count <= 1:
                return Response(
                    {"detail": "Group must have at least one admin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target.role = new_role
            target.save(update_fields=["role"])
            if request.user.id == user_id and new_role == GroupMember.Role.MEMBER:
                caller.role = GroupMember.Role.MEMBER
                caller.save(update_fields=["role"])
            elif demote_self and request.user.id != user_id and new_role == GroupMember.Role.ADMIN:
                caller.role = GroupMember.Role.MEMBER
                caller.save(update_fields=["role"])

        return Response(GroupMemberSerializer(target).data)


class GroupMembersView(APIView):
    """
    GET: Get a list of group members.
    Admins see 'accepted' and 'pending'. Normal members see only 'accepted'.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        group = Group.objects.filter(pk=pk).first()
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        caller_membership = GroupMember.objects.filter(
            group=group,
            user=request.user,
            status=GroupMember.Status.ACCEPTED,
        ).first()

        if not caller_membership:
             return Response({"detail": "You are not a member of this group."}, status=status.HTTP_403_FORBIDDEN)

        if caller_membership.role == GroupMember.Role.ADMIN:
             members = GroupMember.objects.filter(
                group=group,
                status__in=[GroupMember.Status.ACCEPTED, GroupMember.Status.PENDING]
             )
        else:
             members = GroupMember.objects.filter(
                group=group,
                status=GroupMember.Status.ACCEPTED
             )
        
        serializer = GroupMemberSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupRequestsView(APIView):
    """
    PUT: accept (or reject) pending join requests. Only group admins.
    """
    permission_classes = (IsAuthenticated,)

    def put(self, request, pk):
        group = Group.objects.filter(pk=pk).first()
        if not group:
            return Response(
                {"detail": "Group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        caller = GroupMember.objects.filter(
            group=group,
            user=request.user,
            status=GroupMember.Status.ACCEPTED,
        ).first()
        if not caller or caller.role != GroupMember.Role.ADMIN:
            return Response(
                {"detail": "Only group admins can manage requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GroupRequestsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data["user_id"]
        accept = serializer.validated_data["accept"]

        target = GroupMember.objects.filter(
            group=group,
            user_id=user_id,
            status=GroupMember.Status.PENDING,
        ).first()
        if not target:
            return Response(
                {"detail": "No pending request found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if accept:
            accepted_count = group.members.filter(status=GroupMember.Status.ACCEPTED).count()
            if accepted_count >= group.max_participants:
                return Response(
                    {"detail": "Group is full. Cannot accept more members."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target.status = GroupMember.Status.ACCEPTED
            target.save(update_fields=["status"])
            return Response(GroupMemberSerializer(target).data)
        else:
            target.delete()
            return Response({"detail": "Request rejected."}, status=status.HTTP_200_OK)
