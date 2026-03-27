import uuid
from django.db import models


class RequestLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    endpoint = models.ForeignKey('endpoints.MockEndpoint', on_delete=models.CASCADE, related_name='request_logs')
    matched_response = models.ForeignKey('endpoints.MockResponse', on_delete=models.SET_NULL, null=True, related_name='request_logs')
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=500)
    query_params = models.JSONField(default=dict)
    request_headers = models.JSONField(default=dict)
    request_body = models.TextField(blank=True)
    status_code = models.IntegerField()
    duration_ms = models.IntegerField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'request_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['endpoint', '-created_at']),
            models.Index(fields=['status_code']),
        ]

    def __str__(self):
        return f'{self.method} {self.path} → {self.status_code} ({self.duration_ms}ms)'
