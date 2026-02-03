# OneRouter Backend

FastAPI-based API gateway for the OneRouter unified API platform. Routes requests to multiple payment and communication providers through a single interface.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.12+
- **Database**: PostgreSQL (Neon)
- **Cache**: Redis (Upstash)
- **ORM**: SQLAlchemy + Alembic
- **Auth**: Clerk JWT verification

## Features

### Core
- Unified API for payments, SMS, and email
- Multi-provider routing (Razorpay, PayPal, Twilio, Resend)
- API key authentication with rate limiting
- Request idempotency support

### Security
- AES-256-GCM credential encryption at rest
- SHA-256 API key hashing
- Row-level security (RLS) for multi-tenancy
- Webhook signature verification
- CORS and CSRF protection

### Reliability
- Webhook retry system with exponential backoff (max 5 retries)
- Soft delete for data retention
- Comprehensive audit logging
- Health check endpoints

## API Endpoints

### Payments
```
POST   /v1/payments              Create payment order
GET    /v1/payments/{id}         Get payment details
POST   /v1/payments/{id}/capture Capture authorized payment
POST   /v1/refunds               Create refund
```

### Subscriptions
```
POST   /v1/subscriptions              Create subscription
GET    /v1/subscriptions/{id}         Get subscription
DELETE /v1/subscriptions/{id}         Cancel subscription
POST   /v1/subscriptions/{id}/pause   Pause subscription
POST   /v1/subscriptions/{id}/resume  Resume subscription
```

### SMS (Twilio)
```
POST   /v1/sms          Send SMS message
GET    /v1/sms/{id}     Get message status
```

### Email (Resend)
```
POST   /v1/email        Send email
GET    /v1/email/{id}   Get email status
```

### Credits
```
GET    /v1/credits/balance    Get credit balance
GET    /v1/credits/plans      Get pricing plans
POST   /v1/credits/purchase   Purchase credits
GET    /v1/credits/history    Transaction history
```

### Services
```
GET    /api/services                         List connected services
POST   /api/services/{service}/credentials   Save credentials
DELETE /api/services/{service}               Disconnect service
PUT    /api/services/{service}/environment   Toggle test/live
```

### API Keys
```
GET    /api/api-keys         List API keys
POST   /api/api-keys         Create new key
DELETE /api/api-keys/{id}    Revoke key
```

### Webhooks
```
POST   /api/webhooks/{provider}       Receive provider webhooks
GET    /api/webhooks/logs             Get webhook logs
POST   /api/webhooks/queue/{id}/retry Retry failed webhook
```

### Analytics
```
GET    /api/analytics/overview    Usage overview
GET    /api/analytics/timeseries  Time-series data
GET    /api/analytics/logs        Request logs
```

### Admin
```
GET    /api/admin/audit-logs              Get audit logs
GET    /api/admin/users                   List users
PATCH  /api/admin/users/{id}/role         Update user role
POST   /api/admin/webhooks/process-pending Process pending webhooks
```

## Getting Started

### Prerequisites
- Python 3.12+
- PostgreSQL
- Redis

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start server
python run.py
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://user:pass@host:port

# Authentication
CLERK_SECRET_KEY=sk_test_xxx

# Security
SECRET_KEY=<32-char-random-string>
ENCRYPTION_KEY=<32-byte-base64-key>

# Frontend
FRONTEND_URL=http://localhost:3000

# Environment
ENVIRONMENT=development
DEBUG=true

# Optional: Provider API Keys (for platform features)
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
```

### Run Server

```bash
# Development
python run.py

# Or with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
backend/
├── app/
│   ├── auth/               # Authentication
│   │   └── dependencies.py # JWT verification
│   ├── models/             # SQLAlchemy models
│   │   ├── user.py
│   │   ├── api_key.py
│   │   ├── service_credential.py
│   │   └── transaction_log.py
│   ├── routes/             # API endpoints
│   │   ├── unified_api.py  # /v1/* endpoints
│   │   ├── credits.py      # Credits system
│   │   ├── services.py     # Service management
│   │   ├── api_keys.py     # API key management
│   │   ├── webhooks.py     # Webhook handling
│   │   ├── analytics.py    # Analytics
│   │   └── admin.py        # Admin endpoints
│   ├── services/           # Business logic
│   │   ├── adapters/       # Provider adapters
│   │   │   ├── razorpay_adapter.py
│   │   │   ├── paypal_adapter.py
│   │   │   ├── twilio_adapter.py
│   │   │   └── resend_adapter.py
│   │   ├── encryption.py   # AES-256 encryption
│   │   ├── rbac_service.py # Role-based access
│   │   ├── audit_service.py
│   │   └── webhook_retry_service.py
│   ├── database.py         # Database connection
│   ├── config.py           # Settings
│   └── main.py             # FastAPI app
├── alembic/                # Database migrations
├── tests/                  # Test suite
├── requirements.txt
└── run.py                  # Entry point
```

## Database Schema

### Core Tables
- `users` - User accounts (synced from Clerk)
- `api_keys` - API keys with hashed values
- `provider_credentials` - Encrypted service credentials
- `transaction_logs` - API request logs
- `webhook_events` - Webhook delivery tracking
- `credit_transactions` - Credit history

### Security Features
- Soft delete (`is_deleted`, `deleted_at`) on sensitive tables
- Partial indexes for active records
- Row-level security policies

## Testing

```bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Specific test file
pytest tests/test_payments.py -v
```

## Deployment

### Render

```yaml
# render.yaml
services:
  - type: web
    name: onerouter-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Docker

```bash
docker build -t onerouter-backend .
docker run -p 8000:8000 --env-file .env onerouter-backend
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/v1/*` | 100 req/min per API key |
| `/api/*` | 60 req/min per user |
| `/api/admin/*` | 30 req/min |

## Related

- [Main Repository](../README.md)
- [Frontend](../frontend/README.md)
- [Python SDK](../onerouter-sdk/README.md)
- [JavaScript SDK](../onerouter-js/README.md)
