# OneRouter

**The Unified Payment API Platform**

OneRouter is a unified API layer that abstracts multiple payment providers (Razorpay, PayPal, Stripe, etc.) into a single, consistent interface. Build once, integrate everywhere.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Quick Start](#quick-start)
- [Components](#components)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [SDK](#sdk)
- [Payment Integration](#payment-integration)
- [Deployment](#deployment)
- [Concepts](#concepts)

---

## Overview

OneRouter provides three main components:

1. **Frontend** - Next.js dashboard for managing services, API keys, and monitoring
2. **Backend** - FastAPI server handling unified API requests and routing to payment providers
3. **SDK** - Python library for developers to integrate OneRouter into their applications

### Key Features

- ✅ **Unified API**: Single interface for multiple payment providers
- ✅ **Environment Management**: Separate test/live configurations
- ✅ **Security**: API key authentication, encrypted credential storage, CSRF protection
- ✅ **Analytics**: Track usage, costs, and performance
- ✅ **Rate Limiting**: Built-in request throttling
- ✅ **Idempotency**: Prevent duplicate payments
- ✅ **Webhook Handling**: Centralized webhook reception from all providers
- ✅ **Multi-Provider Support**: Razorpay, PayPal, Stripe, Twilio, and more

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Application                      │
│                 (Using OneRouter SDK)               │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   OneRouter SDK                       │
│              (Python, async/sync support)           │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                OneRouter Backend API                 │
│              (FastAPI, PostgreSQL, Redis)            │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Razorpay  │ │   PayPal  │ │  Stripe   │
└───────────┘ └───────────┘ └───────────┘
```

### Data Flow

1. **SDK → Backend**: SDK makes HTTP requests with API key
2. **Backend → Payment Provider**: Backend routes to appropriate provider (Razorpay/PayPal/etc)
3. **Payment Provider → OneRouter Backend**: Webhooks send events back
4. **Backend → SDK**: SDK receives webhook events (if configured)
5. **Frontend → Backend**: Dashboard manages credentials and monitors analytics

---

## How It Works

### For SDK Users

```python
from onerouter import OneRouter

# Initialize with API key
client = OneRouter(api_key="unf_live_xxx")

# Create payment - OneRouter handles provider routing
order = await client.payments.create(
    amount=500.00,
    currency="USD",
    receipt="order_123"
)

# Returns checkout URL
print(f"Pay at: {order['checkout_url']}")

# OneRouter automatically:
# - Routes to correct provider based on your service config
# - Handles retries on network errors
# - Manages idempotency (prevents duplicates)
# - Stores transaction logs
```

### For Frontend Users

The OneRouter dashboard provides:
- **Service Management**: Add/edit payment service credentials
- **API Key Management**: Create/revoke API keys for your apps
- **Environment Switching**: Switch between test and live modes
- **Analytics Dashboard**: View usage, costs, performance metrics
- **Webhook Monitoring**: View webhook delivery logs
- **Transaction Logs**: Track all payment activities

---

## Quick Start

### 1. Get Started with SDK

```bash
# Install
pip install onerouter

# Quick test
python -c "
from onerouter import OneRouter
client = OneRouter(api_key='test_key')
print('SDK initialized successfully!')
"
```

Full SDK documentation: [onerouter-sdk/README.md](onerouter-sdk/README.md)

### 2. Run Backend Locally

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example and fill in)
cp .env.example .env

# Run server
python main.py
```

Backend will start on `http://localhost:8000`

- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

### 3. Run Frontend Locally

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will start on `http://localhost:3000`

---

## Components

### Frontend

**Tech Stack**: Next.js 19, TypeScript, Tailwind CSS, Clerk Authentication

**Features**:
- Dashboard for managing payment services
- API key generation and management
- Environment switching (test/live)
- Real-time analytics and logs
- Payment method marketplace
- Responsive design with dark theme

**Running Locally**:
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

**Deployment**: See [Frontend README](frontend/README.md)

### Backend

**Tech Stack**: FastAPI, Python 3.12+, PostgreSQL, Redis, SQLAlchemy, Alembic

**Features**:
- Unified API for multiple payment providers
- Credential encryption with AES256-GCM
- Redis caching for performance
- Rate limiting per API key
- Webhook signature verification
- Comprehensive logging and monitoring
- Health check endpoints
- CSRF protection

**Running Locally**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit .env with your values
python main.py
```

**Key Environment Variables**:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_xxx

# Security
SECRET_KEY=<32-char-random-string>
ENCRYPTION_KEY=<32-byte-fernet-key>
# Optional: API_KEY_ENCRYPTION_KEY, SESSION_ENCRYPTION_KEY

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Environment
ENVIRONMENT=development
DEBUG=true
```

**Deployment**: See [Backend README](backend/README.md)

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

**Installation**:
```bash
pip install onerouter
```

**Usage Examples**:

```python
# Async usage (recommended)
import asyncio
from onerouter import OneRouter

async def main():
    async with OneRouter(api_key="unf_live_xxx") as client:
        # Create payment
        order = await client.payments.create(
            amount=500.00,
            currency="USD",
            receipt="order_123"
        )
        
        # Get status
        status = await client.payments.get(order['transaction_id'])
        
        print(f"Order created: {order['transaction_id']}")
        print(f"Payment status: {status['status']}")

asyncio.run(main())
```

**Documentation**: [SDK README](onerouter-sdk/README.md)

---

## Payment Integration

### Supported Providers

| Provider | Status | Features |
|----------|--------|----------|
| Razorpay | ✅ Full | Payments, refunds, subscriptions, webhooks |
| PayPal | ✅ Full | Orders, captures, refunds, subscriptions, webhooks |
| Stripe | ✅ Beta | Payments, subscriptions (via adapter) |
| Twilio | ✅ Beta | SMS notifications |

### Live Authorization Process

To enable **live payments** for your application:

#### Step 1: Get Live Credentials

**PayPal**:
- Go to PayPal Developer Dashboard
- Navigate to "My Apps & Credentials"
- Select "Live" environment
- Copy Client ID and Client Secret
- Set `PAYPAL_MODE=live` in backend config

**Razorpay**:
- Go to Razorpay Dashboard
- Select "Production" mode
- Generate Key ID and Key Secret
- Production keys automatically route to live API

#### Step 2: Configure Webhooks

**PayPal**:
1. Dashboard → Your App → Webhooks
2. Add webhook URL: `https://your-domain.com/webhooks/paypal`
3. Select events: PAYMENT.CAPTURED, PAYMENT.SALE.COMPLETED, etc.
4. PayPal will provide `webhook_id` (save this!)
5. Copy `webhook_id` to your OneRouter service config

**Razorpay**:
1. Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/webhooks/razorpay`
3. Copy webhook secret to your backend env (`RAZORPAY_WEBHOOK_SECRET`)

#### Step 3: Update OneRouter Configuration

**Method A: Using Dashboard (Easiest)**
```
1. Go to https://your-frontend.com/services
2. Select your service (PayPal or Razorpay)
3. Click "Switch to Live"
4. OneRouter automatically switches all services to live mode
```

**Method B: Using OneRouter SDK**
```python
from onerouter import OneRouter

client = OneRouter(api_key="your_api_key")

# Switch to live
client.services.switch_environment(
    service_name="paypal",
    environment="live"
)

# Or switch all services at once
client.services.switch_all_environments(environment="live")
```

**Method C: Using Backend API**
```bash
# Switch PayPal to live
curl -X POST https://your-api.com/services/paypal/switch-environment \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"environment": "live"}'

# Switch Razorpay to live
curl -X POST https://your-api.com/services/razorpay/switch-environment \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"environment": "live"}'
```

#### Step 4: Test Before Going Live

```bash
# Test webhook delivery
curl -X POST https://your-api.com/api/webhooks/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"service_name": "paypal", "environment": "live"}'

# Monitor webhook logs
curl https://your-api.com/api/webhooks/logs?service_name=paypal \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Step 5: Update Your Application

**In Your SDK-Based Application:**
```python
# Update environment variable or config
ONEROUTER_ENVIRONMENT = "live"  # or remove default to use production
```

**In Your Direct Integration:**
```python
# No changes needed - OneRouter handles routing automatically
# Just ensure your live credentials are configured
```

#### Step 6: Verify Live Mode

```bash
# Check service status
curl https://your-api.com/api/services/paypal/status

# Response:
{
  "service_name": "paypal",
  "environment": "live",
  "active": true,
  "configured": true
}
```

### Domain Verification (Optional but Recommended)

**PayPal Domain Verification** (for Smart Payment Buttons):
```bash
# Generate verification token via API
curl -X POST https://your-api.com/services/paypal/verify-domain \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"domain": "your-domain.com"}'

# Response includes DNS record to add:
{
  "verification_method": "dns",
  "dns_record": "paypal-site-verification=abc123",
  "instructions": "Add this TXT record to your DNS"
}

# After adding DNS record, confirm:
curl -X POST https://your-api.com/services/paypal/confirm-domain \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"domain": "your-domain.com"}'
```

---

## Deployment

### Backend Deployment (Render)

**Prerequisites**:
- PostgreSQL database (Neon or Render PostgreSQL)
- Redis instance (Render Redis)
- Environment variables configured

**Quick Deploy**:
```bash
# 1. Push code to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Create Render services via dashboard
# - PostgreSQL database
# - Redis instance
# - Web service (Python type, backend directory)

# 3. Configure environment variables
# Set DATABASE_URL, REDIS_URL, CLERK_SECRET_KEY, ENCRYPTION_KEY, SECRET_KEY, FRONTEND_URL
# Set ENVIRONMENT=production, DEBUG=false, API_HOST=0.0.0.0

# 4. Deploy!
# Render automatically builds and deploys
```

**Health Check After Deployment**:
```bash
curl https://your-backend.onrender.com/api/health
```

**Documentation**: [Backend README](backend/README.md)

### Frontend Deployment (Vercel)

**Quick Deploy**:
```bash
cd frontend
npm run build
vercel
```

**Environment Variables** (Set in Vercel Dashboard):
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://your-frontend.com/sign-in
```

**Documentation**: [Frontend README](frontend/README.md)

### SDK Deployment

The SDK is published to PyPI:
```bash
pip install onerouter
```

No deployment needed - simply import and use in your application.

---

## Concepts

### API Keys

API keys authenticate your application with OneRouter. Generate them from the dashboard:

- **Permissions**: Keys can be scoped to specific services or actions
- **Rate Limiting**: Each key has independent rate limits
- **Revocation**: Revoke compromised keys immediately
- **Environments**: Keys work across test and live environments

### Environments

- **Test**: Development and testing environment
  - Uses test credentials from payment providers
  - Lower rate limits allowed
  - No real charges

- **Live**: Production environment
  - Uses live credentials from payment providers
  - Enforces stricter security
  - Real payments processed

### Idempotency

Prevent duplicate payments by using idempotency keys:

```python
order = await client.payments.create(
    amount=100.00,
    idempotency_key="unique-order-123"  # Prevents duplicates
    receipt="user_order_123"
)
```

If you send the same `idempotency_key` twice, OneRouter returns the original order instead of creating a new one.

### Webhooks

Webhooks notify your application about payment events:

**Supported Events**:
- Payment successful
- Payment failed
- Refund processed
- Subscription created/canceled/renewed
- Payment link clicked

**Webhook Security**:
- Signature verification (HMAC for Razorpay, API for PayPal)
- Request ID tracking
- Replay protection

### Rate Limiting

Each API key has:
- **Per-minute limit**: Default 60 requests/minute
- **Per-day limit**: Default 10,000 requests/day
- Configurable per API key via dashboard

---

## Documentation

- **API Documentation**: https://docs.onerouter.com (or `/docs` endpoint on your backend)
- **SDK Reference**: [onerouter-sdk/README.md](onerouter-sdk/README.md)
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

## Security

- **Credential Encryption**: All payment provider credentials encrypted with AES256-GCM
- **API Key Authentication**: Secure token-based authentication
- **CSRF Protection**: Prevents cross-site request forgery
- **Rate Limiting**: Prevents abuse and DoS attacks
- **HTTPS Required**: All production requests must use HTTPS
- **Webhook Signature Verification**: Validates webhook authenticity

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

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) (if available).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.