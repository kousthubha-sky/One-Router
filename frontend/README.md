# OneRouter Frontend

Modern dashboard for the OneRouter unified API platform. Built with Next.js 16, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Clerk
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React

## Features

### Dashboard
- Real-time API usage analytics
- Connected services overview
- Recent activity feed
- Credit balance display

### Service Management
- Connect payment providers (Razorpay, PayPal)
- Connect communication providers (Twilio, Resend)
- Per-service test/live environment toggles
- Credential validation on save

### API Keys
- Generate and manage API keys
- View key usage statistics
- Revoke compromised keys

### Analytics
- API call volume charts
- Success/error rate tracking
- Service performance breakdown
- Cost tracking

### Credits
- View credit balance
- Purchase credits (Razorpay integration)
- Transaction history

### Webhooks
- Configure webhook endpoints
- View webhook delivery logs
- Retry failed webhooks

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Main dashboard with overview |
| `/services` | Manage connected services |
| `/api-keys` | API key management |
| `/analytics` | Usage analytics and charts |
| `/credits` | Credit balance and purchases |
| `/webhooks` | Webhook configuration |
| `/docs` | API documentation |
| `/pricing` | Pricing plans |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/contact` | Contact information |

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── services/           # Services management
│   │   ├── api-keys/           # API key management
│   │   ├── analytics/          # Analytics page
│   │   ├── credits/            # Credits and billing
│   │   ├── webhooks/           # Webhook configuration
│   │   └── ...
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── DashboardLayout.tsx
│   │   ├── GlobalEnvironmentToggle.tsx
│   │   └── ...
│   └── lib/                    # Utilities
│       ├── api-client.ts       # API helper functions
│       └── utils.ts
├── public/                     # Static assets
└── tailwind.config.ts          # Tailwind configuration
```

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel
```

### Docker

```bash
docker build -t onerouter-frontend .
docker run -p 3000:3000 onerouter-frontend
```

## Related

- [Main Repository](../README.md)
- [Backend](../backend/README.md)
- [Python SDK](../onerouter-sdk/README.md)
- [JavaScript SDK](../onerouter-js/README.md)
