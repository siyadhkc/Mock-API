from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Workspace, WorkspaceMember
from .serializers import WorkspaceSerializer, WorkspaceMemberSerializer
from .permissions import IsWorkspaceMember, IsWorkspaceAdminOrOwner


class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer

    def get_queryset(self):
        return Workspace.objects.filter(
            members__user=self.request.user
        ).select_related('owner').prefetch_related('members').distinct()

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        workspace = self.get_object()
        members = workspace.members.select_related('user')
        return Response(WorkspaceMemberSerializer(members, many=True).data)

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        workspace = self.get_object()
        # Check admin/owner
        if not WorkspaceMember.objects.filter(workspace=workspace, user=request.user, role__in=['owner', 'admin']).exists():
            return Response({'detail': 'Only admins can invite members.'}, status=403)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        member, created = WorkspaceMember.objects.get_or_create(
            workspace=workspace, user=user,
            defaults={'role': request.data.get('role', 'member')}
        )
        return Response(WorkspaceMemberSerializer(member).data, status=201 if created else 200)
