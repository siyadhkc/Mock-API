import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


HTTP_METHODS = [
    ('GET', 'GET'), ('POST', 'POST'), ('PUT', 'PUT'),
    ('PATCH', 'PATCH'), ('DELETE', 'DELETE'), ('OPTIONS', 'OPTIONS'),
]

RULE_OPERATORS = [
    ('eq', 'equals'), ('neq', 'not equals'), ('contains', 'contains'),
    ('starts_with', 'starts with'), ('gt', 'greater than'), ('lt', 'less than'),
    ('exists', 'exists'), ('not_exists', 'not exists'),
]

RULE_SOURCES = [
    ('body', 'Request Body'), ('query', 'Query Param'),
    ('header', 'Header'), ('path', 'Path Param'),
]


class MockEndpoint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey('workspaces.Workspace', on_delete=models.CASCADE, related_name='endpoints')
    name = models.CharField(max_length=200)
    path = models.CharField(max_length=500, help_text='e.g. /users/:id')
    method = models.CharField(max_length=10, choices=HTTP_METHODS)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='created_endpoints')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mock_endpoints'
        ordering = ['path', 'method']
        unique_together = ('workspace', 'path', 'method')

    def __str__(self):
        return f'{self.method} {self.path}'


class MockResponse(models.Model):
    """A response variant for an endpoint. Multiple responses per endpoint (rule-based routing)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    endpoint = models.ForeignKey(MockEndpoint, on_delete=models.CASCADE, related_name='responses')
    name = models.CharField(max_length=200, default='Default')
    status_code = models.IntegerField(default=200)
    headers = models.JSONField(default=dict, help_text='Response headers as JSON object')
    body = models.TextField(default='{}')
    body_type = models.CharField(max_length=20, choices=[('json', 'JSON'), ('xml', 'XML'), ('text', 'Plain Text'), ('html', 'HTML')], default='json')
    # Latency simulation (Phase 3)
    latency_ms = models.IntegerField(default=0, help_text='Fixed latency in ms')
    latency_jitter_ms = models.IntegerField(default=0, help_text='Random jitter added to latency')
    # AI generation flag
    is_ai_generated = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False, help_text='Returned when no rule matches')
    priority = models.IntegerField(default=0, help_text='Higher = evaluated first')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mock_responses'
        ordering = ['-priority', 'created_at']

    def __str__(self):
        return f'{self.name} ({self.status_code})'


class ResponseRule(models.Model):
    """A single condition within a rule set for a response."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response = models.ForeignKey(MockResponse, on_delete=models.CASCADE, related_name='rules')
    source = models.CharField(max_length=20, choices=RULE_SOURCES)
    field = models.CharField(max_length=200, help_text='Field name / key')
    operator = models.CharField(max_length=20, choices=RULE_OPERATORS)
    value = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'response_rules'

    def evaluate(self, request_data: dict) -> bool:
        """Evaluate this rule against incoming request data."""
        source_data = request_data.get(self.source, {})
        field_value = source_data.get(self.field)

        if self.operator == 'exists':
            return field_value is not None
        if self.operator == 'not_exists':
            return field_value is None
        if field_value is None:
            return False

        field_str = str(field_value)
        if self.operator == 'eq':
            return field_str == self.value
        if self.operator == 'neq':
            return field_str != self.value
        if self.operator == 'contains':
            return self.value in field_str
        if self.operator == 'starts_with':
            return field_str.startswith(self.value)
        try:
            if self.operator == 'gt':
                return float(field_value) > float(self.value)
            if self.operator == 'lt':
                return float(field_value) < float(self.value)
        except (ValueError, TypeError):
            return False
        return False
