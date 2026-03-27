import json
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_ai_response_task(self, endpoint_id: str, api_key: str, prompt: str):
    """Generate a mock response body using Claude claude-sonnet-4-20250514 (bring-your-own-key)."""
    try:
        import anthropic
        from .models import MockEndpoint, MockResponse

        endpoint = MockEndpoint.objects.select_related('workspace').get(id=endpoint_id)
        client = anthropic.Anthropic(api_key=api_key)

        system_prompt = (
            "You are a mock API response generator. "
            "Generate realistic, well-structured JSON response bodies for REST API endpoints. "
            "Return ONLY valid JSON with no explanation or markdown."
        )
        user_prompt = (
            f"Generate a realistic mock response for: {endpoint.method} {endpoint.path}\n"
            f"Workspace: {endpoint.workspace.name}\n"
            f"Description: {endpoint.description or 'N/A'}\n"
        )
        if prompt:
            user_prompt += f"\nAdditional context: {prompt}"

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        body = message.content[0].text

        # Validate it's actually JSON
        json.loads(body)

        response = MockResponse.objects.create(
            endpoint=endpoint,
            name='AI Generated',
            status_code=200,
            body=body,
            body_type='json',
            is_ai_generated=True,
            is_default=False,
        )
        return {'response_id': str(response.id), 'status': 'created'}

    except Exception as exc:
        logger.exception('AI generation task failed')
        raise self.retry(exc=exc, countdown=30)
