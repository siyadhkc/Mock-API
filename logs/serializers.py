from rest_framework import serializers
from .models import RequestLog


class RequestLogSerializer(serializers.ModelSerializer):
    endpoint_path = serializers.CharField(source='endpoint.path', read_only=True)
    endpoint_method = serializers.CharField(source='endpoint.method', read_only=True)
    workspace_id = serializers.UUIDField(source='endpoint.workspace_id', read_only=True)

    class Meta:
        model = RequestLog
        fields = [
            'id', 'endpoint', 'endpoint_path', 'endpoint_method', 'workspace_id',
            'matched_response', 'method', 'path', 'query_params', 'request_headers',
            'request_body', 'status_code', 'duration_ms', 'ip_address', 'created_at'
        ]
        read_only_fields = fields
