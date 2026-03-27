"""
Rule Engine — evaluates incoming mock requests and returns the correct MockResponse.
This is the core differentiating logic of MockAPI Pro.
"""
import json
import time
import random
import logging
from typing import Optional
from django.http import HttpRequest, JsonResponse, HttpResponse
from .models import MockEndpoint, MockResponse

logger = logging.getLogger(__name__)


def extract_request_data(request: HttpRequest, path_params: dict) -> dict:
    """Normalise incoming request into a dict suitable for rule evaluation."""
    body = {}
    if request.content_type and 'application/json' in request.content_type:
        try:
            body = json.loads(request.body or '{}')
        except json.JSONDecodeError:
            pass

    return {
        'body': body if isinstance(body, dict) else {},
        'query': dict(request.GET),
        'header': {k.lower().replace('http_', '').replace('_', '-'): v
                   for k, v in request.META.items() if k.startswith('HTTP_')},
        'path': path_params,
    }


def match_response(endpoint: MockEndpoint, request_data: dict) -> Optional[MockResponse]:
    """
    Evaluate all non-default responses in priority order.
    A response matches if ALL its rules pass (AND logic).
    Returns the first match, or the default response, or None.
    """
    responses = endpoint.responses.prefetch_related('rules').order_by('-priority')
    default_response = None

    for response in responses:
        if response.is_default:
            default_response = response
            continue
        rules = list(response.rules.all())
        if not rules:
            # No rules = always matches (acts as fallthrough)
            return response
        if all(rule.evaluate(request_data) for rule in rules):
            return response

    return default_response


def apply_latency(response: MockResponse):
    """Simulate network latency if configured."""
    delay = response.latency_ms
    if response.latency_jitter_ms > 0:
        delay += random.randint(0, response.latency_jitter_ms)
    if delay > 0:
        time.sleep(delay / 1000)


def build_http_response(mock_response: MockResponse) -> HttpResponse:
    """Build a Django HttpResponse from a MockResponse."""
    content_type_map = {
        'json': 'application/json',
        'xml': 'application/xml',
        'text': 'text/plain',
        'html': 'text/html',
    }
    content_type = content_type_map.get(mock_response.body_type, 'application/json')
    response = HttpResponse(
        content=mock_response.body,
        status=mock_response.status_code,
        content_type=content_type,
    )
    for key, value in (mock_response.headers or {}).items():
        response[key] = value
    response['X-MockAPI-Response-Id'] = str(mock_response.id)
    return response
