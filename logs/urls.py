from django.urls import path
from .views import RequestLogListView, RequestLogDetailView

urlpatterns = [
    path('', RequestLogListView.as_view(), name='log-list'),
    path('<uuid:pk>/', RequestLogDetailView.as_view(), name='log-detail'),
]
