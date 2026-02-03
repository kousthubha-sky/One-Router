# OneRouter JavaScript SDK

Official TypeScript/JavaScript SDK for OneRouter - Unified API for payments, SMS, email, and more.

[![npm version](https://badge.fury.io/js/onerouter-js.svg)](https://www.npmjs.com/package/onerouter-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install onerouter-js
# or
yarn add onerouter-js
# or
pnpm add onerouter-js
```

## Quick Start

```typescript
import { OneRouter } from 'onerouter-js';

const client = new OneRouter({ apiKey: 'unf_live_xxx' });

// Create payment
const order = await client.payments.create({
    amount: 500.00,
    currency: 'INR'
});

console.log(`Order ID: ${order.transaction_id}`);
console.log(`Checkout URL: ${order.checkout_url}`);
```

## Features

- **Unified API**: Single interface for Razorpay, PayPal, Twilio, Resend
- **Any Runtime**: Works in Node.js, Deno, Bun, Edge functions, browsers
- **Type Safety**: Full TypeScript support with autocomplete
- **Lightweight**: Uses native fetch, no heavy dependencies
- **Error Handling**: Comprehensive exception types

## Usage Examples

### Payments

```typescript
const client = new OneRouter({ apiKey: 'unf_live_xxx' });

// Create payment order
const order = await client.payments.create({
    amount: 500.00,
    currency: 'INR',
    receipt: 'order_123'
});

// Get payment details
const details = await client.payments.get(order.transaction_id);
console.log(`Status: ${details.status}`);
console.log(`Provider: ${details.provider}`);

// Create refund
const refund = await client.payments.refund({
    payment_id: order.provider_order_id,
    amount: 100.00  // Partial refund
});
```

### Send SMS (Twilio)

```typescript
const client = new OneRouter({ apiKey: 'unf_live_xxx' });

// Send SMS
const sms = await client.sms.send({
    to: '+1234567890',
    body: 'Your verification code is 123456'
});

console.log(`Message SID: ${sms.message_id}`);
console.log(`Status: ${sms.status}`);

// Check delivery status
const status = await client.sms.get(sms.message_id);
console.log(`Delivery status: ${status.status}`);
```

### Send Email (Resend)

```typescript
const client = new OneRouter({ apiKey: 'unf_live_xxx' });

// Send email
const email = await client.email.send({
    to: 'user@example.com',
    subject: 'Welcome to OneRouter!',
    html_body: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
    from_email: 'hello@yourdomain.com'  // Optional
});

console.log(`Email ID: ${email.email_id}`);
console.log(`Status: ${email.status}`);
```

### Subscriptions

```typescript
const client = new OneRouter({ apiKey: 'unf_live_xxx' });

// Create subscription
const subscription = await client.subscriptions.create({
    plan_id: 'plan_monthly_99',
    customer_notify: true,
    total_count: 12
});

// Get subscription details
const subDetails = await client.subscriptions.get(subscription.subscription_id);

// Cancel subscription
await client.subscriptions.cancel({
    subscription_id: subscription.subscription_id,
    cancel_at_cycle_end: true
});
```

### Payment Links

```typescript
const client = new OneRouter({ apiKey: 'unf_live_xxx' });

// Create payment link
const link = await client.paymentLinks.create({
    amount: 999.00,
    description: 'Premium Plan',
    customer_email: 'user@example.com'
});

console.log(`Share this link: ${link.short_url}`);
```

### Error Handling

```typescript
import { OneRouter, AuthenticationError, RateLimitError, ValidationError, APIError } from 'onerouter-js';

const client = new OneRouter({ apiKey: 'unf_live_xxx' });

try {
    const order = await client.payments.create({ amount: 500.00 });
} catch (error) {
    if (error instanceof AuthenticationError) {
        console.error('Invalid API key');
    } else if (error instanceof RateLimitError) {
        console.error(`Rate limit exceeded. Retry after ${error.retryAfter} seconds`);
    } else if (error instanceof ValidationError) {
        console.error(`Validation error: ${error.message}`);
    } else if (error instanceof APIError) {
        console.error(`API error (${error.statusCode}): ${error.message}`);
    }
}
```

## Configuration

```typescript
const client = new OneRouter({
    apiKey: 'unf_live_xxx',
    baseUrl: 'https://api.onerouter.dev',  // Optional: Custom API URL
    timeout: 30000,                         // Optional: Request timeout (ms)
    maxRetries: 3                           // Optional: Max retry attempts
});
```

## Platform Examples

### Next.js API Route

```typescript
// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OneRouter } from 'onerouter-js';

const client = new OneRouter({ apiKey: process.env.ONEROUTER_API_KEY! });

export async function POST(request: NextRequest) {
    const { amount, currency } = await request.json();

    const order = await client.payments.create({
        amount,
        currency: currency || 'USD'
    });

    return NextResponse.json(order);
}
```

### Edge Function (Vercel/Cloudflare)

```typescript
import { OneRouter } from 'onerouter-js';

const client = new OneRouter({ apiKey: process.env.ONEROUTER_API_KEY! });

export default async function handler(request: Request) {
    const { amount, currency } = await request.json();

    const order = await client.payments.create({
        amount,
        currency: currency || 'USD'
    });

    return Response.json(order);
}

export const config = { runtime: 'edge' };
```

### AWS Lambda

```typescript
import { OneRouter } from 'onerouter-js';

const client = new OneRouter({ apiKey: process.env.ONEROUTER_API_KEY! });

export const handler = async (event: any) => {
    const { amount, currency } = JSON.parse(event.body);

    const order = await client.payments.create({
        amount,
        currency
    });

    return {
        statusCode: 200,
        body: JSON.stringify(order)
    };
};
```

## API Reference

### Payments

| Method | Description |
|--------|-------------|
| `payments.create(amount, currency, ...)` | Create a payment order |
| `payments.get(transaction_id)` | Get payment details |
| `payments.refund(payment_id, amount)` | Create refund |

### SMS

| Method | Description |
|--------|-------------|
| `sms.send(to, body)` | Send SMS message |
| `sms.get(message_id)` | Get delivery status |

### Email

| Method | Description |
|--------|-------------|
| `email.send(to, subject, html_body, ...)` | Send email |
| `email.get(email_id)` | Get email status |

### Subscriptions

| Method | Description |
|--------|-------------|
| `subscriptions.create(plan_id, ...)` | Create subscription |
| `subscriptions.get(subscription_id)` | Get subscription details |
| `subscriptions.cancel(subscription_id)` | Cancel subscription |

### Payment Links

| Method | Description |
|--------|-------------|
| `paymentLinks.create(amount, ...)` | Create payment link |

## Requirements

- Node.js 18+ (or any runtime with native fetch)
- TypeScript 5.0+ (optional, for type support)

## Support

- **Documentation**: https://docs.onerouter.dev
- **npm**: https://www.npmjs.com/package/onerouter-js
- **GitHub**: https://github.com/onerouter/onerouter-js
- **Email**: support@onerouter.dev

## License

MIT License - see LICENSE file for details.

## Related

- [Main Repository](../README.md)
- [Python SDK](../onerouter-sdk/README.md)
- [Backend API](../backend/README.md)
