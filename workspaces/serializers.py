from rest_framework import serializers
from django.utils.text import slugify
from .models import Workspace, WorkspaceMember
from core.serializers import UserSerializer


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ['id', 'user', 'role', 'joined_at']


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    endpoint_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ['id', 'name', 'slug', 'description', 'owner', 'member_count', 'endpoint_count', 'user_role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'owner', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_endpoint_count(self, obj):
        return obj.endpoints.count()

    def get_user_role(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        membership = obj.members.filter(user=request.user).first()
        return membership.role if membership else None

    def create(self, validated_data):
        validated_data['slug'] = slugify(validated_data['name'])
        validated_data['owner'] = self.context['request'].user
        workspace = super().create(validated_data)
        WorkspaceMember.objects.create(workspace=workspace, user=workspace.owner, role='owner')
        return workspace
