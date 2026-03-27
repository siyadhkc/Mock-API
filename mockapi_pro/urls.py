from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/workspaces/', include('workspaces.urls')),
    path('api/endpoints/', include('endpoints.urls')),
    path('api/logs/', include('logs.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Mock endpoint catch-all — must be last
    path('mock/', include('endpoints.mock_urls')),
]
