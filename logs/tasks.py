from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


@shared_task
def broadcast_log(workspace_id: str, log_id: str):
    """Push new request log to WebSocket channel group for real-time dashboard."""
    try:
        from .models import RequestLog
        from .serializers import RequestLogSerializer

        log = RequestLog.objects.select_related('endpoint', 'matched_response').get(id=log_id)
        data = RequestLogSerializer(log).data

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'logs_{workspace_id}',
            {'type': 'log.message', 'data': data}
        )
    except Exception:
        logger.exception('broadcast_log task failed')


@shared_task
def purge_old_logs():
    """Celery beat task — delete logs older than LOG_RETENTION_DAYS."""
    from django.conf import settings
    from django.utils import timezone
    from datetime import timedelta
    from .models import RequestLog

    cutoff = timezone.now() - timedelta(days=settings.MOCK_REQUEST_LOG_RETENTION_DAYS)
    deleted, _ = RequestLog.objects.filter(created_at__lt=cutoff).delete()
    logger.info(f'Purged {deleted} old request logs.')
    return deleted
