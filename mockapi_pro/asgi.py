import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import logs.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mockapi_pro.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(logs.routing.websocket_urlpatterns)
    ),
})
