from django.urls import re_path
from .consumers import LogConsumer

websocket_urlpatterns = [
    re_path(r'ws/logs/(?P<workspace_id>[0-9a-f-]+)/$', LogConsumer.as_asgi()),
]
