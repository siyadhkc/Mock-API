from django.contrib import admin
from .models import MockEndpoint, MockResponse, ResponseRule


class ResponseInline(admin.TabularInline):
    model = MockResponse
    extra = 0


class RuleInline(admin.TabularInline):
    model = ResponseRule
    extra = 0


@admin.register(MockEndpoint)
class EndpointAdmin(admin.ModelAdmin):
    list_display = ['method', 'path', 'workspace', 'is_active', 'created_at']
    list_filter = ['method', 'is_active']
    search_fields = ['path', 'name']
    inlines = [ResponseInline]


@admin.register(MockResponse)
class MockResponseAdmin(admin.ModelAdmin):
    list_display = ['name', 'endpoint', 'status_code', 'is_default', 'priority']
    inlines = [RuleInline]
