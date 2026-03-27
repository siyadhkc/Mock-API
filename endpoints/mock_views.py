"""
The actual mock server request handler.
Routes incoming requests to matched MockEndpoint → selects MockResponse via rule engine.
"""
import time
import logging
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import MockEndpoint
from .engine import extract_request_data, match_response, apply_latency, build_http_response
from logs.models import RequestLog
from logs.tasks import broadcast_log

logger = logging.getLogger(__name__)


@csrf_exempt
def mock_handler(request: HttpRequest, workspace_slug: str, path: str) -> HttpResponse:
    start_time = time.time()
    full_path = '/' + path

    try:
        endpoint = MockEndpoint.objects.filter(
            workspace__slug=workspace_slug,
            path=full_path,
            method=request.method,
            is_active=True,
        ).select_related('workspace').first()

        if not endpoint:
            # Try path params: /users/:id style
            endpoint = _match_path_params(workspace_slug, full_path, request.method)

        if not endpoint:
            return JsonResponse({'detail': 'No matching endpoint found.'}, status=404)

        path_params = _extract_path_params(endpoint.path, full_path)
        request_data = extract_request_data(request, path_params)
        matched_response = match_response(endpoint, request_data)

        if not matched_response:
            return JsonResponse({'detail': 'No matching response rule.'}, status=404)

        apply_latency(matched_response)
        response = build_http_response(matched_response)
        duration_ms = int((time.time() - start_time) * 1000)

        # Fire-and-forget log (Celery task)
        _log_request(request, endpoint, matched_response, response.status_code, duration_ms)

        return response

    except Exception as e:
        logger.exception('Mock handler error')
        return JsonResponse({'detail': 'Internal server error.'}, status=500)


def _match_path_params(workspace_slug: str, path: str, method: str):
    """Match endpoints with :param style path params."""
    candidates = MockEndpoint.objects.filter(
        workspace__slug=workspace_slug, method=method, is_active=True
    ).select_related('workspace')

    path_parts = path.strip('/').split('/')
    for endpoint in candidates:
        ep_parts = endpoint.path.strip('/').split('/')
        if len(ep_parts) != len(path_parts):
            continue
        if all(ep == rp or ep.startswith(':') for ep, rp in zip(ep_parts, path_parts)):
            return endpoint
    return None


def _extract_path_params(template: str, actual: str) -> dict:
    params = {}
    for tp, ap in zip(template.strip('/').split('/'), actual.strip('/').split('/')):
        if tp.startswith(':'):
            params[tp[1:]] = ap
    return params


def _log_request(request, endpoint, matched_response, status_code, duration_ms):
    try:
        body_preview = request.body[:2000].decode('utf-8', errors='replace') if request.body else ''
        log = RequestLog.objects.create(
            endpoint=endpoint,
            method=request.method,
            path=request.path,
            query_params=dict(request.GET),
            request_headers=dict(request.headers),
            request_body=body_preview,
            matched_response=matched_response,
            status_code=status_code,
            duration_ms=duration_ms,
            ip_address=_get_client_ip(request),
        )
        broadcast_log.delay(str(endpoint.workspace_id), str(log.id))
    except Exception:
        logger.exception('Failed to log request')


def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')
