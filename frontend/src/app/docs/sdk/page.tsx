'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  Terminal,
  CheckCircle,
  Github,
  Play,
  Database,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SDKDocsPage() {
  const [activeTab, setActiveTab] = useState('installation');

  const tabs = [
    { id: 'installation', title: 'Installation', icon: Code },
    { id: 'quickstart', title: 'Quick Start', icon: Play },
    { id: 'api-reference', title: 'API Reference', icon: Database },
    { id: 'examples', title: 'Examples', icon: Terminal },
    { id: 'error-handling', title: 'Error Handling', icon: AlertTriangle }
  ];



  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-black to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-mono text-sm font-bold">OR</span>
                </div>
                <span className="font-bold text-lg font-mono text-white">OneRouter</span>
              </Link>
              <span className="text-[#888]">/</span>
              <Link href="/docs" className="text-[#888] hover:text-cyan-400">docs</Link>
              <span className="text-[#888]">/</span>
              <span className="text-cyan-400">sdk</span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="https://github.com/onerouter/sdk-python" target="_blank" className="text-[#888] hover:text-white">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="/docs">
                <Button variant="outline" className="border-[#222] text-white hover:border-cyan-500">
                  ← Back to Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="sticky top-24">
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">SDK Documentation</h3>
                <ul className="space-y-2">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'text-[#888] hover:text-white hover:bg-[#222]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{tab.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Quick Links */}
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/onboarding" className="block text-[#888] hover:text-cyan-400 text-sm">
                    Get Started Free →
                  </Link>
                  <Link href="/api-keys" className="block text-[#888] hover:text-cyan-400 text-sm">
                    Generate API Keys →
                  </Link>
                  <Link href="/contact" className="block text-[#888] hover:text-cyan-400 text-sm">
                    Need Help? →
                  </Link>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'installation' && <InstallationSection />}
            {activeTab === 'quickstart' && <QuickStartSection />}
            {activeTab === 'api-reference' && <APIReferenceSection />}
            {activeTab === 'examples' && <ExamplesSection />}
            {activeTab === 'error-handling' && <ErrorHandlingSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

function InstallationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">SDK Installation</h1>
        <p className="text-xl text-[#888] leading-relaxed">
          Install and set up the OneRouter Python SDK for your project.
        </p>
      </div>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white">Python SDK</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Installation</h3>
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
              <pre className="text-sm text-green-400">pip install onerouter</pre>
            </div>
            <p className="text-sm text-[#888] mt-2">
              Or install with optional async dependencies:
            </p>
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 mt-2">
              <pre className="text-sm text-green-400">pip install onerouter[async]</pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Requirements</h3>
            <ul className="text-sm text-[#888] space-y-2">
              <li>• Python 3.8 or higher</li>
              <li>• httpx (automatically installed)</li>
              <li>• Optional: aiohttp for async support</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Verify Installation</h3>
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
              <pre className="text-sm text-cyan-400">python -c &quot;import onerouter; print(&apos;OneRouter SDK installed successfully!&apos;)&quot;</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white">SDK Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1a1a1a] rounded border border-[#222]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Latest Version</h4>
                <Badge className="bg-green-500/20 text-green-400">v2.0.0</Badge>
              </div>
              <p className="text-sm text-[#888]">Released December 2025</p>
              <ul className="text-sm text-[#888] mt-2 space-y-1">
                <li>• Enhanced error handling</li>
                <li>• Async client support</li>
                <li>• Improved webhook validation</li>
              </ul>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded border border-[#222]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Legacy Version</h4>
                <Badge variant="secondary">v1.x</Badge>
              </div>
              <p className="text-sm text-[#888]">Deprecated - Upgrade recommended</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickStartSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">Quick Start</h1>
        <p className="text-xl text-[#888] leading-relaxed">
          Get started with OneRouter SDK in minutes.
        </p>
      </div>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Basic Setup</h3>
          <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
            <pre className="text-sm text-cyan-400">{`import onerouter

# Initialize the client
client = onerouter.Client(
    api_key="rzp_test_xxxxxxxxxxxxxx",
    api_secret="secret_xxxxxxxxxxxxxx",
    environment="test"  # or "live"
)

# Create a payment order
order = client.orders.create({
    "amount": 1000,  # Amount in cents (1000 = $10.00)
    "currency": "USD",
    "receipt": "order_123",
    "notes": {
        "customer_id": "cust_123"
    }
})

print(f"Order created: {order['id']}")
print(f"Payment URL: {order['payment_link']}")`}
          </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Handle Payment Completion</h3>
          <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
            <pre className="text-sm text-cyan-400">{`# Capture the payment (if using manual capture)
payment = client.payments.capture(order['id'], {
    "amount": 1000
})

print(f"Payment status: {payment['status']}")

# Check payment details
payment_details = client.payments.get(payment['id'])
print(f"Payment method: {payment_details.get('method', 'N/A')}")`}
          </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Success!</h3>
              <p className="text-[#888]">
                You&apos;ve created your first payment order with OneRouter SDK. The payment link can be shared with customers to complete the transaction.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function APIReferenceSection() {
  const [activeMethod, setActiveMethod] = useState('orders');

  const methods = {
    orders: {
      title: 'Orders',
      methods: [
        {
          name: 'create',
          signature: 'client.orders.create(data)',
          description: 'Create a new payment order',
          params: [
            { name: 'amount', type: 'int', required: true, desc: 'Amount in smallest currency unit' },
            { name: 'currency', type: 'str', required: true, desc: 'Currency code (USD, INR, EUR)' },
            { name: 'receipt', type: 'str', required: false, desc: 'Receipt number' },
            { name: 'notes', type: 'dict', required: false, desc: 'Additional metadata' }
          ],
          returns: 'Order object with id, payment_link, and status'
        },
        {
          name: 'get',
          signature: 'client.orders.get(order_id)',
          description: 'Retrieve order details',
          params: [
            { name: 'order_id', type: 'str', required: true, desc: 'Order ID to retrieve' }
          ],
          returns: 'Order object with full details'
        }
      ]
    },
    payments: {
      title: 'Payments',
      methods: [
        {
          name: 'capture',
          signature: 'client.payments.capture(payment_id, data)',
          description: 'Capture an authorized payment',
          params: [
            { name: 'payment_id', type: 'str', required: true, desc: 'Payment ID to capture' },
            { name: 'amount', type: 'int', required: false, desc: 'Amount to capture (partial capture)' }
          ],
          returns: 'Payment object with updated status'
        },
        {
          name: 'get',
          signature: 'client.payments.get(payment_id)',
          description: 'Retrieve payment details',
          params: [
            { name: 'payment_id', type: 'str', required: true, desc: 'Payment ID to retrieve' }
          ],
          returns: 'Payment object with full details'
        }
      ]
    },
    refunds: {
      title: 'Refunds',
      methods: [
        {
          name: 'create',
          signature: 'client.refunds.create(data)',
          description: 'Create a refund',
          params: [
            { name: 'payment_id', type: 'str', required: true, desc: 'Payment ID to refund' },
            { name: 'amount', type: 'int', required: false, desc: 'Refund amount (partial refund)' }
          ],
          returns: 'Refund object with refund details'
        }
      ]
    },
    subscriptions: {
      title: 'Subscriptions',
      methods: [
        {
          name: 'create',
          signature: 'client.subscriptions.create(data)',
          description: 'Create a subscription',
          params: [
            { name: 'plan_id', type: 'str', required: true, desc: 'Plan identifier' },
            { name: 'total_count', type: 'int', required: true, desc: 'Number of billing cycles' },
            { name: 'customer_id', type: 'str', required: false, desc: 'Customer identifier' }
          ],
          returns: 'Subscription object with subscription details'
        },
        {
          name: 'cancel',
          signature: 'client.subscriptions.cancel(subscription_id, options)',
          description: 'Cancel a subscription',
          params: [
            { name: 'subscription_id', type: 'str', required: true, desc: 'Subscription ID to cancel' },
            { name: 'cancel_at_cycle_end', type: 'bool', required: false, desc: 'Cancel at end of billing cycle' }
          ],
          returns: 'Updated subscription object'
        }
      ]
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
        <p className="text-xl text-[#888] leading-relaxed">
          Complete OneRouter SDK API reference with methods, parameters, and examples.
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <Card className="bg-[#0a0a0a] border-[#222]">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">API Methods</h3>
              <div className="space-y-2">
                {Object.entries(methods).map(([key, method]) => (
                  <button
                    key={key}
                    onClick={() => setActiveMethod(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeMethod === key
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-[#888] hover:text-white hover:bg-[#222]'
                    }`}
                  >
                    {method.title}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="bg-[#0a0a0a] border-[#222]">
            <CardHeader>
              <CardTitle className="text-white">
                {methods[activeMethod as keyof typeof methods].title} API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {methods[activeMethod as keyof typeof methods].methods.map((method, index) => (
                <div key={index} className="border border-[#222] rounded-lg p-4">
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">client.{activeMethod}.{method.name}</h4>
                    <code className="text-cyan-400 text-sm">{method.signature}</code>
                  </div>

                  <p className="text-[#888] mb-4">{method.description}</p>

                  <div className="mb-4">
                    <h5 className="text-white font-medium mb-2">Parameters</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#222]">
                            <th className="text-left py-2 px-4 text-cyan-400">Parameter</th>
                            <th className="text-left py-2 px-4 text-cyan-400">Type</th>
                            <th className="text-left py-2 px-4 text-cyan-400">Required</th>
                            <th className="text-left py-2 px-4 text-cyan-400">Description</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#888]">
                          {method.params.map((param, paramIndex) => (
                            <tr key={paramIndex} className="border-b border-[#222]">
                              <td className="py-2 px-4"><code>{param.name}</code></td>
                              <td className="py-2 px-4">{param.type}</td>
                              <td className="py-2 px-4">
                                <Badge variant={param.required ? "default" : "secondary"}>
                                  {param.required ? 'Yes' : 'No'}
                                </Badge>
                              </td>
                              <td className="py-2 px-4">{param.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-white font-medium mb-2">Returns</h5>
                    <p className="text-sm text-[#888]">{method.returns}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExamplesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">Code Examples</h1>
        <p className="text-xl text-[#888] leading-relaxed">
          Complete examples for common use cases and integration patterns.
        </p>
      </div>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">E-commerce Checkout</h3>
          <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
            <pre className="text-sm text-cyan-400">{`import onerouter

class PaymentService:
    def __init__(self, api_key, api_secret):
        self.client = onerouter.Client(
            api_key=api_key,
            api_secret=api_secret,
            environment="live"
        )

    def create_checkout_session(self, cart_items, customer_email):
        """Create payment order for e-commerce checkout"""
        total_amount = sum(item['price'] * item['quantity'] for item in cart_items)

        order = self.client.orders.create({
            "amount": int(total_amount * 100),  # Convert to cents
            "currency": "USD",
            "receipt": f"order_{customer_email}_{int(time.time())}",
            "notes": {
                "customer_email": customer_email,
                "items_count": len(cart_items)
            }
        })

        return {
            "order_id": order["id"],
            "payment_url": order["payment_link"],
            "amount": total_amount
        }

    def verify_payment(self, order_id):
        """Verify payment completion"""
        order = self.client.orders.get(order_id)

        if order["status"] == "paid":
            # Payment successful
            return {"status": "success", "order": order}
        else:
            # Payment pending or failed
            return {"status": "pending", "order": order}

# Usage
payment_service = PaymentService("your_key", "your_secret")
checkout = payment_service.create_checkout_session([
    {"name": "Widget", "price": 29.99, "quantity": 2}
], "customer@example.com")

print(f"Payment URL: {checkout['payment_url']}")`}
          </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Subscription Management</h3>
          <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
            <pre className="text-sm text-cyan-400">{`class SubscriptionService:
    def __init__(self, api_key, api_secret):
        self.client = onerouter.Client(
            api_key=api_key,
            api_secret=api_secret
        )

    def create_monthly_subscription(self, customer_id, plan_price):
        """Create monthly subscription"""
        subscription = self.client.subscriptions.create({
            "plan_id": f"monthly_{plan_price}",
            "customer_id": customer_id,
            "total_count": 12,  # 1 year
            "notes": {
                "billing_cycle": "monthly",
                "price": plan_price
            }
        })

        return subscription

    def handle_subscription_webhook(self, webhook_data):
        """Process subscription webhook events"""
        event_type = webhook_data["event"]

        if event_type == "subscription.cancelled":
            subscription_id = webhook_data["data"]["subscription_id"]
            # Cancel user access, notify customer, etc.
            self.cancel_user_subscription(subscription_id)

        elif event_type == "subscription.created":
            # Handle new subscription
            pass

    def cancel_user_subscription(self, subscription_id, immediate=False):
        """Cancel subscription"""
        if immediate:
            # Cancel immediately
            self.client.subscriptions.cancel(subscription_id, {
                "cancel_at_cycle_end": False
            })
        else:
            # Cancel at end of billing cycle
            self.client.subscriptions.cancel(subscription_id, {
                "cancel_at_cycle_end": True
            })

# Usage
sub_service = SubscriptionService("your_key", "your_secret")
subscription = sub_service.create_monthly_subscription("cust_123", 29.99)
print(f"Subscription created: {subscription['id']}")`}
          </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Webhook Handler</h3>
          <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
            <pre className="text-sm text-cyan-400">{`from flask import Flask, request, jsonify
import hmac
import hashlib
import onerouter

app = Flask(__name__)

# Webhook secret from OneRouter dashboard
WEBHOOK_SECRET = "your_webhook_secret"

class WebhookHandler:
    def __init__(self, webhook_secret):
        self.secret = webhook_secret
        self.client = onerouter.Client(
            api_key="your_api_key",
            api_secret="your_api_secret"
        )

    def verify_signature(self, payload, signature):
        """Verify webhook signature"""
        expected_signature = hmac.new(
            self.secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)

    def handle_payment_captured(self, data):
        """Handle successful payment"""
        payment_id = data["payment_id"]
        order_id = data["order_id"]

        # Update order status in database
        # Send confirmation email
        # Update inventory
        print(f"Payment captured: {payment_id}")

    def handle_payment_failed(self, data):
        """Handle failed payment"""
        payment_id = data["payment_id"]

        # Notify customer
        # Log failure reason
        print(f"Payment failed: {payment_id}")

@app.route('/webhooks/onerouter', methods=['POST'])
def handle_webhook():
    handler = WebhookHandler(WEBHOOK_SECRET)

    payload = request.get_data()
    signature = request.headers.get('X-OneRouter-Signature')

    # Verify webhook authenticity
    if not handler.verify_signature(payload, signature):
        return jsonify({'error': 'Invalid signature'}), 401

    webhook_data = request.get_json()
    event_type = webhook_data["event"]

    # Handle different event types
    if event_type == "payment.captured":
        handler.handle_payment_captured(webhook_data["data"])
    elif event_type == "payment.failed":
        handler.handle_payment_failed(webhook_data["data"])

    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True)`}
          </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorHandlingSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">Error Handling</h1>
        <p className="text-xl text-[#888] leading-relaxed">
          Handle errors gracefully and implement proper retry logic in your OneRouter integration.
        </p>
      </div>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white">Exception Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1a1a1a] rounded border border-red-500/30">
              <h4 className="text-red-400 font-medium mb-2">ValidationError</h4>
              <p className="text-sm text-[#888]">Invalid request parameters or missing required fields.</p>
               <pre className="text-xs text-red-400 mt-2">Field: &apos;amount&apos;, Message: &apos;Amount must be positive&apos;</pre>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded border border-red-500/30">
              <h4 className="text-red-400 font-medium mb-2">APIError</h4>
              <p className="text-sm text-[#888]">API returned an error response from the server.</p>
               <pre className="text-xs text-red-400 mt-2">Code: &apos;INSUFFICIENT_FUNDS&apos;, Message: &apos;Payment failed&apos;</pre>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded border border-red-500/30">
              <h4 className="text-red-400 font-medium mb-2">AuthenticationError</h4>
              <p className="text-sm text-[#888]">Invalid API credentials or authentication failed.</p>
              <pre className="text-xs text-red-400 mt-2">Invalid API key or secret</pre>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded border border-yellow-500/30">
              <h4 className="text-yellow-400 font-medium mb-2">NetworkError</h4>
              <p className="text-sm text-[#888]">Network connectivity issues or timeouts.</p>
              <pre className="text-xs text-yellow-400 mt-2">Connection timeout or DNS resolution failed</pre>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded border border-yellow-500/30">
              <h4 className="text-yellow-400 font-medium mb-2">RateLimitError</h4>
              <p className="text-sm text-[#888]">API rate limit exceeded.</p>
              <pre className="text-xs text-yellow-400 mt-2">Too many requests. Retry after 60 seconds</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Comprehensive Error Handling</h3>
          <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
            <pre className="text-sm text-cyan-400">{`import onerouter
import time
import logging

logger = logging.getLogger(__name__)

class PaymentProcessor:
    def __init__(self, api_key, api_secret):
        self.client = onerouter.Client(
            api_key=api_key,
            api_secret=api_secret
        )
        self.max_retries = 3
        self.retry_delay = 1  # seconds

    def create_order_with_retry(self, order_data):
        """Create order with automatic retry logic"""
        for attempt in range(self.max_retries):
            try:
                order = self.client.orders.create(order_data)
                logger.info(f"Order created successfully: {order['id']}")
                return order

            except onerouter.RateLimitError as e:
                wait_time = e.retry_after or self.retry_delay * (2 ** attempt)
                logger.warning(f"Rate limited. Waiting {wait_time}s before retry")
                time.sleep(wait_time)

            except onerouter.NetworkError as e:
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)
                    logger.warning(f"Network error. Retrying in {wait_time}s")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Network error after {self.max_retries} attempts")
                    raise

            except onerouter.ValidationError as e:
                # Don't retry validation errors
                logger.error(f"Validation error: {e.field} - {e.description}")
                raise

            except onerouter.APIError as e:
                # Check if error is retryable
                if self._is_retryable_error(e.code):
                    if attempt < self.max_retries - 1:
                        wait_time = self.retry_delay * (2 ** attempt)
                        logger.warning(f"API error ({e.code}). Retrying in {wait_time}s")
                        time.sleep(wait_time)
                        continue

                logger.error(f"API error: {e.code} - {e.description}")
                raise

            except Exception as e:
                logger.error(f"Unexpected error: {type(e).__name__}: {e}")
                raise

        raise Exception(f"Failed to create order after {self.max_retries} attempts")

    def _is_retryable_error(self, error_code):
        """Check if error is retryable"""
        retryable_errors = [
            'GATEWAY_TIMEOUT',
            'SERVICE_UNAVAILABLE',
            'INTERNAL_SERVER_ERROR',
            'NETWORK_ERROR'
        ]
        return error_code in retryable_errors

# Usage
processor = PaymentProcessor("your_key", "your_secret")

try:
    order = processor.create_order_with_retry({
        "amount": 1000,
        "currency": "USD",
        "receipt": "order_123"
    })
    print(f"Order created: {order['id']}")
except Exception as e:
    print(f"Failed to create order: {e}")`}
          </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#222]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Best Practices</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Implement Exponential Backoff</h4>
                <p className="text-sm text-[#888]">Use exponential backoff for retries to avoid overwhelming the API.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Log Errors Appropriately</h4>
                <p className="text-sm text-[#888]">Log errors with sufficient context for debugging while avoiding sensitive data.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Handle Idempotency</h4>
                <p className="text-sm text-[#888]">Use idempotency keys for operations that might be retried.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Monitor API Health</h4>
                <p className="text-sm text-[#888]">Implement health checks and monitoring for API availability.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}