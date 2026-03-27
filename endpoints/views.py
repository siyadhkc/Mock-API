from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MockEndpoint, MockResponse
from .serializers import MockEndpointSerializer, MockEndpointListSerializer, MockResponseSerializer
from workspaces.models import WorkspaceMember


class MockEndpointViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = MockEndpoint.objects.filter(
            workspace__members__user=self.request.user
        ).select_related('workspace', 'created_by').prefetch_related('responses__rules')

        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        return qs.distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return MockEndpointListSerializer
        return MockEndpointSerializer

    @action(detail=True, methods=['post'], url_path='generate-ai')
    def generate_ai_response(self, request, pk=None):
        """Generate a mock response body using Claude API (bring-your-own-key)."""
        endpoint = self.get_object()
        api_key = request.data.get('api_key') or request.headers.get('X-Anthropic-Key')
        if not api_key:
            return Response({'detail': 'Anthropic API key required.'}, status=400)

        from .tasks import generate_ai_response_task
        task = generate_ai_response_task.delay(str(endpoint.id), api_key, request.data.get('prompt', ''))
        return Response({'task_id': task.id, 'detail': 'AI generation started.'})


class MockResponseViewSet(viewsets.ModelViewSet):
    serializer_class = MockResponseSerializer

    def get_queryset(self):
        return MockResponse.objects.filter(
            endpoint__workspace__members__user=self.request.user
        ).prefetch_related('rules').distinct()
