from django.contrib import admin
from .models import RequestLog


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    list_display = ['method', 'path', 'status_code', 'duration_ms', 'ip_address', 'created_at']
    list_filter = ['method', 'status_code']
    search_fields = ['path', 'ip_address']
    readonly_fields = [f.name for f in RequestLog._meta.fields]

    def has_add_permission(self, request):
        return False
