from django.urls import re_path
from .mock_views import mock_handler

urlpatterns = [
    re_path(r'^(?P<workspace_slug>[\w-]+)/(?P<path>.*)$', mock_handler, name='mock_handler'),
]
