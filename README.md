# MockAPI Pro

> Self-hostable mock API server with rule-based response routing, real-time request logs, multi-workspace team access, and AI-powered response generation (BYOK).

## Stack

| Layer | Tech |
|---|---|
| Backend | Django 5, Django REST Framework, Channels (WebSocket), Celery, Redis |
| Auth | JWT via SimpleJWT (access + refresh + blacklist) |
| Database | PostgreSQL |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query |
| Async | Celery workers + Redis broker |
| Realtime | Django Channels + WebSocket + Redis channel layer |
| AI | Anthropic Claude API (BYOK — your key, never stored) |
| Infra | Docker Compose |

## Features

- **Multi-workspace** — team-based workspaces with RBAC (owner / admin / member / viewer)
- **Rule engine** — per-response AND-logic rules matching on `body`, `query`, `header`, `path` fields with operators: `eq`, `neq`, `contains`, `starts_with`, `gt`, `lt`, `exists`, `not_exists`
- **Multiple responses per endpoint** — priority-ordered, first matching rule wins, fallback to default
- **Path parameters** — `:id` style path matching (e.g. `/users/:id`)
- **Real-time logs** — WebSocket-streamed request logs per workspace; Celery broadcasts on every hit
- **AI generation** — Claude generates realistic JSON response bodies from endpoint context (BYOK)
- **OpenAPI docs** — auto-generated via drf-spectacular at `/api/docs/`
- **Log retention** — configurable automatic purge via Celery Beat

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env with your values

docker compose up --build

# In a new terminal:
docker compose exec backend python manage.py createsuperuser
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8000/api/  
Admin: http://localhost:8000/admin/  
API Docs: http://localhost:8000/api/docs/

## Local development (without Docker)

### Backend

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # configure DB + Redis

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# In separate terminals:
celery -A mockapi_pro worker -l info
celery -A mockapi_pro beat -l info
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Making a mock request

```bash
# 1. Create workspace with slug "my-project"
# 2. Create endpoint: GET /users/:id
# 3. Add response with body: { "id": 1, "name": "Alice" }

curl http://localhost:8000/mock/my-project/users/42
# → { "id": 1, "name": "Alice" }
```

## Rule engine example

Endpoint: `POST /checkout`  
Response A (status 402, rules: `body.plan eq free`):  
```json
{ "error": "Upgrade required" }
```  
Response B (default, status 200):  
```json
{ "order_id": "abc123" }
```

```bash
curl -X POST /mock/my-project/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "free"}'
# → 402 { "error": "Upgrade required" }

curl -X POST /mock/my-project/checkout \
  -d '{"plan": "pro"}'
# → 200 { "order_id": "abc123" }
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/login/` | Get JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/auth/me/` | Current user |
| CRUD | `/api/workspaces/` | Workspaces |
| POST | `/api/workspaces/{id}/invite/` | Invite member |
| CRUD | `/api/endpoints/mock-endpoints/` | Endpoints |
| POST | `/api/endpoints/mock-endpoints/{id}/generate-ai/` | AI response gen |
| CRUD | `/api/endpoints/mock-responses/` | Responses + rules |
| GET | `/api/logs/` | Request logs |
| WS | `ws://host/ws/logs/{workspace_id}/` | Real-time log stream |
| * | `/mock/{workspace_slug}/{path}` | Mock server catch-all |

## Running tests

```bash
pip install pytest pytest-django
pytest tests/ -v
```

## Project structure

```
mockapi_pro/
├── core/           # Custom User model, JWT auth views
├── workspaces/     # Workspace + WorkspaceMember RBAC
├── endpoints/      # MockEndpoint, MockResponse, ResponseRule
│   ├── engine.py   # Rule evaluation engine (core logic)
│   ├── mock_views.py   # Mock server request handler
│   └── tasks.py    # AI generation Celery task
├── logs/           # RequestLog, WebSocket consumer, Celery broadcast
├── frontend/       # React + TypeScript + Vite + TailwindCSS
├── tests/          # Pytest test suite
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```
