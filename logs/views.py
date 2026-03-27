from rest_framework import generics
from .models import RequestLog
from .serializers import RequestLogSerializer


class RequestLogListView(generics.ListAPIView):
    serializer_class = RequestLogSerializer

    def get_queryset(self):
        qs = RequestLog.objects.filter(
            endpoint__workspace__members__user=self.request.user
        ).select_related('endpoint', 'matched_response').distinct()

        workspace_id = self.request.query_params.get('workspace')
        endpoint_id = self.request.query_params.get('endpoint')
        status_code = self.request.query_params.get('status_code')

        if workspace_id:
            qs = qs.filter(endpoint__workspace_id=workspace_id)
        if endpoint_id:
            qs = qs.filter(endpoint_id=endpoint_id)
        if status_code:
            qs = qs.filter(status_code=status_code)
        return qs


class RequestLogDetailView(generics.RetrieveAPIView):
    serializer_class = RequestLogSerializer

    def get_queryset(self):
        return RequestLog.objects.filter(
            endpoint__workspace__members__user=self.request.user
        ).distinct()
