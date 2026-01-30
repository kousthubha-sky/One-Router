# OneRouter

**The Unified Multi-Service API SDK Platform**

OneRouter is a unified API layer that abstracts multiple service providers (Payments, SMS, Email, and more) into a single, consistent interface. Build once, integrate everywhere.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Supported Services](#supported-services)
- [Quick Start](#quick-start)
- [Components](#components)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [SDK](#sdk)
- [Deployment](#deployment)
- [Security](#security)
- [Documentation](#documentation)

---

## Overview

OneRouter provides a single SDK that works for multiple service categories:

- **Payments**: Razorpay, PayPal
- **SMS**: Twilio
- **Email**: Resend
- **More services coming**: Webhooks, file storage, databases, etc.

### What We Are

- **Multi-Service Integration Platform** - One SDK for payments, SMS, email, and more
- **API Abstraction Layer** - Translates different provider APIs into one unified format per service
- **Not a Service Provider** - We don't process payments, send SMS, or send emails ourselves
- **A Routing & Credential Management Layer** - Routes API calls to the provider the user configured, manages their API keys securely
- **Multi-tenant SaaS** - Each customer has isolated data and encrypted credentials
- **Developer-First** - Provides SDKs in Python and JavaScript with async/sync support

### Key Features

- **Unified API**: Single interface for multiple service providers across categories
- **Multi-Service Support**: Payments, SMS, Email, and more
- **Environment Management**: Separate test/live configurations
- **Security**: API key authentication, encrypted credential storage, row-level security
- **Analytics**: Track usage, costs, and performance across all services
- **Rate Limiting**: Built-in request throttling per API key
- **Idempotency**: Prevent duplicate requests
- **Webhook Handling**: Centralized webhook reception from all providers
- **Provider Flexibility**: Switch providers without code changes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer's App                              │
│                (Using OneRouter SDK/API)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Request (Payments, SMS, Email, etc)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              OneRouter Frontend (Dashboard)                      │
│  • Services page - Connect Razorpay/PayPal/Twilio/Resend keys  │
│  • API Key generation - Create keys for the SDK                │
│  • Service Configuration - Which provider per service category  │
│  • Monitoring - View transaction logs per service              │
│  • Analytics - Track usage and costs across all services       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Authentication with API Key
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            OneRouter Backend (API Gateway)                       │
│  • Validates the request and API key                           │
│  • Looks up customer's credentials for requested service       │
│  • Routes to the correct provider based on service config      │
│  • Calls provider's API with credentials                       │
│  • Logs the transaction and calculates cost                    │
│  • Returns consistent response format                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Encrypted credentials for each service
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            Service Providers                                     │
│                                                                  │
│  PAYMENTS:          SMS:              EMAIL:                    │
│  • Razorpay         • Twilio          • Resend                  │
│  • PayPal                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **SDK → Backend**: SDK makes HTTP requests with API key
2. **Backend → Service Provider**: Backend routes to appropriate provider based on service type
3. **Provider → OneRouter Backend**: Webhooks send events back
4. **Backend → SDK**: SDK receives webhook events (if configured)
5. **Frontend → Backend**: Dashboard manages credentials and monitors analytics

---

## Supported Services

### Payments

| Provider | Status | Features |
|----------|--------|----------|
| Razorpay | ✅ Full | Payments, refunds, subscriptions, webhooks |
| PayPal | ✅ Full | Orders, captures, refunds, subscriptions, webhooks |

### Communications

| Category | Provider | Status | Features |
|----------|----------|--------|----------|
| SMS | Twilio | ✅ Full | SMS sending, delivery status |
| Email | Resend | ✅ Full | Email sending, delivery status |

---

## Quick Start

### 1. Install SDK

**Python:**
```bash
pip install onerouter
```

**JavaScript:**
```bash
npm install onerouter-js
```

### 2. Quick Test

**Python:**
```python
from onerouter import OneRouter
client = OneRouter(api_key="test_key")
print("SDK initialized successfully!")
```

**JavaScript:**
```javascript
import { OneRouter } from 'onerouter-js';
const client = new OneRouter({ apiKey: 'test_key' });
console.log("SDK initialized successfully!");
```

Full SDK documentation: [onerouter-sdk/README.md](onerouter-sdk/README.md)

### 3. Run Backend Locally

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run server
python main.py
```

Backend will start on `http://localhost:8000`

- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

### 4. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:3000`

---

## Components

### Frontend

**Tech Stack**: Next.js 19, TypeScript, Tailwind CSS, Clerk Authentication

**Features**:
- Dashboard for managing service provider credentials
- API key generation and management
- Environment switching (test/live)
- Real-time analytics and logs
- Service marketplace
- Responsive design with dark theme

**Pages**:
- `/` - Homepage
- `/dashboard` - Main dashboard with overview
- `/services` - Connect and manage all service providers
- `/subscriptions` - Manage subscriptions
- `/marketplace` - Browse and add new services/providers
- `/api-keys` - Generate and manage API keys
- `/webhooks` - Manage webhook endpoints per service

**Running Locally:**
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

### Backend

**Tech Stack**: FastAPI, Python 3.12+, PostgreSQL, Redis, SQLAlchemy, Alembic

**Features**:
- Unified API for multiple service providers
- Credential encryption with AES256-GCM
- Redis caching for performance
- Rate limiting per API key
- Webhook signature verification
- Comprehensive logging and monitoring
- Health check endpoints
- Row-level security (RLS) for multi-tenancy

**Key API Endpoints:**

**Payments:**
```
POST /v1/payments - Create a one-time payment
GET /v1/payments/{payment_id} - Get payment details
POST /v1/subscriptions - Create a subscription
POST /v1/refunds - Refund a payment
```

**SMS:**
```
POST /v1/sms - Send SMS message
GET /v1/sms/{message_id} - Get SMS delivery status
```

**Email:**
```
POST /v1/email - Send email
GET /v1/email/{email_id} - Get email delivery status
```

**Service Management:**
```
GET /api/services - List connected services
POST /api/services/{service}/{provider}/connect - Connect a provider
DELETE /api/services/{service}/{provider} - Disconnect a provider
```

**API Key Management:**
```
GET /api/api-keys - List all API keys
POST /api/api-keys - Generate a new API key
DELETE /api/api-keys/{key_id} - Revoke an API key
```

**Running Locally:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

**Key Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_xxx

# Security
SECRET_KEY=<32-char-random-string>
ENCRYPTION_KEY=<32-byte-fernet-key>

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# Environment
ENVIRONMENT=development
DEBUG=true
```

### SDK

**Tech Stack**: Python 3.8+, httpx, pydantic, asyncio

**Features**:
- Async and sync interfaces
- Automatic retries with exponential backoff
- Idempotency support
- Comprehensive error handling
- Type hints for IDE autocomplete
- Subscriptions support
- Payment links support
- Webhook configuration

**Python Usage:**
```python
from onerouter import OneRouter

client = OneRouter(api_key="unf_live_xxx")

# Payments
payment = await client.payments.create(
    amount=500.00,
    currency="USD",
    receipt="order_123"
)

# SMS
sms = await client.sms.send(
    to="+1234567890",
    body="Your verification code is 123456"
)

# Email
email = await client.email.send(
    to="user@example.com",
    subject="Welcome",
    html_body="<h1>Welcome!</h1>"
)
```

**JavaScript Usage:**
```javascript
import { OneRouter } from 'onerouter-js';

const client = new OneRouter({
  apiKey: 'unf_live_xxx'
});

// Payments
const payment = await client.payments.create({
  amount: 500.00,
  currency: 'USD'
});

// SMS
const sms = await client.sms.send({
  to: '+1234567890',
  body: 'Your verification code is 123456'
});

// Email
const email = await client.email.send({
  to: 'user@example.com',
  subject: 'Welcome',
  html_body: '<h1>Welcome!</h1>'
});
```

---

## Deployment

### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
vercel
```

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://your-frontend.com/sign-in
```

### Backend Deployment (Render)

**Prerequisites:**
- PostgreSQL database (Neon)
- Redis instance (Upstash)
- Environment variables configured

**Quick Deploy:**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

**Environment Variables:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
ENCRYPTION_KEY=<32-byte-encryption-key>
REDIS_URL=redis://user:pass@host:port
CLERK_SECRET_KEY=sk_test_xxx
ENVIRONMENT=production
DEBUG=false
```

### Database (Neon)

- PostgreSQL 17.7
- Automatic backups
- Row-level security enabled

### Redis (Upstash)

- Serverless Redis
- Rate limiting
- Idempotency caching

---

## Security

### API Key Security

- API keys authenticate your application with OneRouter
- Keys are hashed before storage (only hash stored, not actual key)
- Rate limiting per API key
- Revoke compromised keys immediately
- Keys work across test and live environments

### Credential Encryption

- All service provider credentials encrypted with AES256-GCM
- Encryption key stored in environment variables (not in code or database)
- Credentials decrypted only in memory when needed
- Different encryption keys per environment (test vs production)

### Row-Level Security (RLS)

- PostgreSQL automatically filters data by user_id
- Users can only access their own data
- Even with database access, cannot query other users' data

### Webhook Security

- Signature verification for all incoming webhooks
- Request ID tracking
- Replay protection

---

## Documentation

- **API Documentation**: http://localhost:8000/docs (or /docs endpoint on your backend)
- **SDK Reference**: [onerouter-sdk/README.md](onerouter-sdk/README.md)
- **Complete System Guide**: [docsi/complete_system_guide.md](docsi/complete_system_guide.md)
- **Backend API**: [Backend README](backend/README.md)
- **Frontend Guide**: [Frontend README](frontend/README.md)

---

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### SDK Tests

```bash
cd onerouter-sdk
pytest tests/ -v --cov=onerouter --cov-report=html
```

---

## Support

- **Documentation**: https://docs.onerouter.com
- **GitHub Issues**: https://github.com/onerouter/onerouter/issues
- **Email**: support@onerouter.com

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) if available.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
