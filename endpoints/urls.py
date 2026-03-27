from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MockEndpointViewSet, MockResponseViewSet

router = DefaultRouter()
router.register(r'mock-endpoints', MockEndpointViewSet, basename='mock-endpoint')
router.register(r'mock-responses', MockResponseViewSet, basename='mock-response')

urlpatterns = [path('', include(router.urls))]
