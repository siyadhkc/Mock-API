from rest_framework import serializers
from .models import MockEndpoint, MockResponse, ResponseRule


class ResponseRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResponseRule
        fields = ['id', 'source', 'field', 'operator', 'value']


class MockResponseSerializer(serializers.ModelSerializer):
    rules = ResponseRuleSerializer(many=True, required=False)

    class Meta:
        model = MockResponse
        fields = [
            'id', 'endpoint', 'name', 'status_code', 'headers', 'body',
            'body_type', 'latency_ms', 'latency_jitter_ms', 'is_ai_generated',
            'is_default', 'priority', 'rules', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        rules_data = validated_data.pop('rules', [])
        response = super().create(validated_data)
        for rule_data in rules_data:
            ResponseRule.objects.create(response=response, **rule_data)
        return response

    def update(self, instance, validated_data):
        rules_data = validated_data.pop('rules', None)
        instance = super().update(instance, validated_data)
        if rules_data is not None:
            instance.rules.all().delete()
            for rule_data in rules_data:
                ResponseRule.objects.create(response=instance, **rule_data)
        return instance


class MockEndpointSerializer(serializers.ModelSerializer):
    responses = MockResponseSerializer(many=True, read_only=True)
    response_count = serializers.SerializerMethodField()

    class Meta:
        model = MockEndpoint
        fields = [
            'id', 'workspace', 'name', 'path', 'method', 'description',
            'is_active', 'created_by', 'response_count', 'responses',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_response_count(self, obj):
        return obj.responses.count()

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class MockEndpointListSerializer(MockEndpointSerializer):
    """Lightweight serializer for list views — no nested responses."""
    class Meta(MockEndpointSerializer.Meta):
        fields = [
            'id', 'workspace', 'name', 'path', 'method', 'description',
            'is_active', 'response_count', 'created_at', 'updated_at'
        ]
