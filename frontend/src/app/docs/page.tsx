'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: '🚀' },
    { id: 'quickstart', title: 'Quick Start', icon: '⚡' },
    { id: 'sdk', title: 'Python SDK', icon: '🐍' },
    { id: 'js-sdk', title: 'JavaScript SDK', icon: '⚛️' },
    { id: 'sms', title: 'SMS', icon: '📱' },
    { id: 'email', title: 'Email', icon: '📧' },
    { id: 'payments', title: 'Payments', icon: '💳' },
    { id: 'subscriptions', title: 'Subscriptions', icon: '🔄' },
    { id: 'api', title: 'REST API', icon: '🌐' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 border border-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-mono text-sm font-bold">OR</span>
                </div>
                <span className="font-bold text-lg font-mono text-white">OneRouter</span>
              </Link>

              <nav className="hidden md:flex items-center space-x-6">
                <a href="#docs" className="text-gray-300 hover:text-white text-sm font-medium">Docs</a>
                <a href="#api" className="text-gray-300 hover:text-white text-sm font-medium">API</a>
                <a href="#examples" className="text-gray-300 hover:text-white text-sm font-medium">Examples</a>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="border border-gray-700 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-gray-600 w-64"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  ⌘K
                </div>
              </div>

              <Link href="/api-keys">
                <button className="border border-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:border-gray-600 transition-colors">
                  Get API Keys
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="sticky top-8">
              <div className="space-y-1">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Documentation</h3>
                  <ul className="space-y-1">
                    {sections.slice(0, 2).map(section => (
                      <li key={section.id}>
                        <button
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activeSection === section.id
                              ? 'text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Quickstart</h3>
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setActiveSection('sdk')}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          activeSection === 'sdk'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Python SDK
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Integrations</h3>
                  <ul className="space-y-1">
                    {sections.slice(3, 6).map(section => (
                      <li key={section.id}>
                        <button
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activeSection === section.id
                              ? 'text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Reference</h3>
                  <ul className="space-y-1">
                    {sections.slice(6).map(section => (
                      <li key={section.id}>
                        <button
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activeSection === section.id
                              ? 'text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-[600px]">
            <div className="border border-gray-800 rounded-lg p-8">
              {activeSection === 'overview' && <OverviewSection />}
              {activeSection === 'quickstart' && <QuickStartSection />}
              {activeSection === 'sdk' && <SDKSection />}
               {activeSection === 'js-sdk' && <JSSDKSection />}
              {activeSection === 'sms' && <SMSSection />}
              {activeSection === 'email' && <EmailSection />}
              {activeSection === 'payments' && <PaymentsSection />}
              {activeSection === 'subscriptions' && <SubscriptionsSection />}
              {activeSection === 'api' && <APISection />}
              {activeSection === 'troubleshooting' && <TroubleshootingSection />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">Introduction</h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          OneRouter is a unified API for payments, SMS, email, and subscriptions.
          Send messages, process payments, and manage subscriptions through a single interface.
        </p>
      </div>

      {/* Quickstart Cards */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-6">Quickstart</h2>
        <p className="text-gray-300 mb-8">Get OneRouter set up in your project.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 border border-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🐍</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Python SDK</h3>
            </div>
            <p className="text-gray-400 text-sm">Install and configure the Python SDK</p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 border border-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🌐</span>
              </div>
              <h3 className="text-lg font-semibold text-white">REST API</h3>
            </div>
            <p className="text-gray-400 text-sm">Use the REST API directly</p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 border border-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Send SMS</h3>
            </div>
            <p className="text-gray-400 text-sm">Send your first SMS message</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-6">Features</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Communications</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-white mt-1">•</span>
                <div>
                  <strong className="text-white">SMS</strong>
                  <p className="text-sm text-gray-400">Send SMS messages via Twilio with delivery tracking</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white mt-1">•</span>
                <div>
                  <strong className="text-white">Email</strong>
                  <p className="text-sm text-gray-400">Send emails via Resend with delivery tracking</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white mt-1">•</span>
                <div>
                  <strong className="text-white">Email</strong>
                  <p className="text-sm text-gray-400">Send emails via Resend with delivery tracking</p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Payments</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-white mt-1">•</span>
                <div>
                  <strong className="text-white">Multiple Providers</strong>
                  <p className="text-sm text-gray-400">Razorpay, PayPal, and more</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white mt-1">•</span>
                <div>
                  <strong className="text-white">Subscriptions</strong>
                  <p className="text-sm text-gray-400">Manage recurring payments</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Start Section
function QuickStartSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Quick Start</h1>
        <p className="text-gray-300 leading-relaxed">
          Get started with OneRouter in under 5 minutes.
        </p>
      </div>

      <div className="space-y-8">
        <div className="border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border border-gray-700 rounded-lg flex items-center justify-center text-white font-bold">1</div>
            <h3 className="text-xl font-semibold text-white">Install SDK</h3>
          </div>
          <div className="border border-gray-700 rounded p-4 mb-4">
            <code className="text-white">pip install onerouter==2.0.1</code>
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border border-gray-700 rounded-lg flex items-center justify-center text-white font-bold">2</div>
            <h3 className="text-xl font-semibold text-white">Get API Key</h3>
          </div>
          <p className="text-gray-300 mb-4">Sign up and get your API key from the dashboard.</p>
          <div className="border border-gray-700 rounded p-4">
            <div className="text-sm text-gray-400 mb-2">Your API Key:</div>
            <code className="text-white">unf_live_xxxxxxxxxxxxxxxxxxxxxxxx</code>
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border border-gray-700 rounded-lg flex items-center justify-center text-white font-bold">3</div>
            <h3 className="text-xl font-semibold text-white">Send SMS</h3>
          </div>
          <div className="border border-gray-700 rounded p-4">
            <pre className="text-white text-sm overflow-x-auto">
{`from onerouter import OneRouter

client = OneRouter(api_key="unf_live_xxx")

sms = client.sms.send(
    to="+1234567890",
    body="Hello from OneRouter!"
)

print("SMS sent:", sms['message_id'])`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// SDK Section
function SDKSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Python SDK</h1>
        <p className="text-gray-300 leading-relaxed">
          Complete integration guide for the OneRouter Python SDK. Everything you need to integrate payments, SMS, email, and subscriptions.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Base URLs & Environments</h3>
        <div className="space-y-4">
           <div>
             <h4 className="text-white font-medium mb-2">Production</h4>
             <div className="border border-gray-700 rounded p-3">
               <code className="text-white">https://one-backend.stack-end.com</code>
             </div>
           </div>
          <div>
            <h4 className="text-white font-medium mb-2">Development</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">http://localhost:8000</code>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Custom Environment</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">https://your-domain.com</code>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Complete SDK Setup</h3>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`from onerouter import OneRouter

# Production Setup
client = OneRouter(
    api_key="unf_live_your_production_key_here",
    base_url="https://one-backend.stack-end.com",
    timeout=30,
    max_retries=3,
    environment="production"
)

# Development Setup
client = OneRouter(
    api_key="unf_test_your_test_key_here",
    base_url="http://localhost:8000",
    timeout=60,
    max_retries=5,
    environment="development"
)

# Custom Environment
client = OneRouter(
    api_key="unf_live_your_key_here",
    base_url="https://api.yourdomain.com",
    timeout=45,
    max_retries=3
)`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Environment Variables</h3>
        <div className="border border-gray-700 rounded p-4 mb-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# .env file
ONEROUTER_API_KEY=unf_live_your_key_here
ONEROUTER_BASE_URL=https://one-backend.stack-end.com
ONEROUTER_TIMEOUT=30
ONEROUTER_MAX_RETRIES=3
ONEROUTER_ENVIRONMENT=production`}
          </pre>
        </div>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# Python code using environment variables
import os
from onerouter import OneRouter

client = OneRouter(
    api_key=os.getenv('ONEROUTER_API_KEY'),
    base_url=os.getenv('ONEROUTER_BASE_URL', 'https://one-backend.stack-end.com'),
    timeout=int(os.getenv('ONEROUTER_TIMEOUT', '30')),
    max_retries=int(os.getenv('ONEROUTER_MAX_RETRIES', '3'))
)`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Webhook Integration</h3>
        <div className="space-y-4">
          <div className="border border-gray-700 rounded p-4">
            <pre className="text-white text-sm overflow-x-auto">
{`from flask import Flask, request, jsonify
from onerouter import OneRouter

app = Flask(__name__)
client = OneRouter(api_key="your_key")

@app.route('/webhooks/onerouter', methods=['POST'])
def onerouter_webhook():
    try:
        # Verify webhook signature (recommended)
        signature = request.headers.get('X-OneRouter-Signature')
        payload = request.get_data()

        # Process webhook data
        data = request.get_json()

        if data['event'] == 'payment.succeeded':
            # Handle successful payment
            payment_id = data['data']['id']
            print(f"Payment succeeded: {payment_id}")

        elif data['event'] == 'sms.delivered':
            # Handle SMS delivery
            sms_id = data['data']['id']
            print(f"SMS delivered: {sms_id}")

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': 'processing_failed'}), 500

if __name__ == '__main__':
    app.run(port=3001)`}
            </pre>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Django Integration</h3>
        <div className="border border-gray-700 rounded p-4 mb-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# settings.py
ONEROUTER_CONFIG = {
    'API_KEY': 'unf_live_your_key_here',
    'BASE_URL': 'https://one-backend.stack-end.com',
    'TIMEOUT': 30,
    'MAX_RETRIES': 3,
    'ENVIRONMENT': 'production'
}`}
          </pre>
        </div>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# views.py
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from onerouter import OneRouter
import json

def get_onerouter_client():
    config = settings.ONEROUTER_CONFIG
    return OneRouter(
        api_key=config['API_KEY'],
        base_url=config['BASE_URL'],
        timeout=config['TIMEOUT'],
        max_retries=config['MAX_RETRIES']
    )

@csrf_exempt
def create_payment(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        client = get_onerouter_client()

        payment = client.payments.create(
            amount=data['amount'],
            currency=data['currency'],
            customer_id=data['customer_id'],
            payment_method=data['payment_method']
        )

        return JsonResponse({
            'success': True,
            'payment_id': payment['transaction_id'],
            'checkout_url': payment.get('checkout_url')
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">FastAPI Integration</h3>
        <div className="border border-gray-700 rounded p-4 mb-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# config.py
from pydantic import BaseSettings

class OneRouterSettings(BaseSettings):
    api_key: str
    base_url: str = "https://one-backend.stack-end.com"
    timeout: int = 30
    max_retries: int = 3
    environment: str = "production"

    class Config:
        env_prefix = "ONEROUTER_"

settings = OneRouterSettings()`}
          </pre>
        </div>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# main.py
from fastapi import FastAPI, HTTPException, Depends
from onerouter import OneRouter
from config import settings

app = FastAPI()

def get_onerouter_client() -> OneRouter:
    return OneRouter(
        api_key=settings.api_key,
        base_url=settings.base_url,
        timeout=settings.timeout,
        max_retries=settings.max_retries
    )

@app.post("/api/payments")
async def create_payment(
    amount: int,
    currency: str,
    customer_id: str,
    payment_method: dict,
    client: OneRouter = Depends(get_onerouter_client)
):
    try:
        payment = client.payments.create(
            amount=amount,
            currency=currency,
            customer_id=customer_id,
            payment_method=payment_method
        )

        return {
            "payment_id": payment['transaction_id'],
            "status": payment['status'],
            "checkout_url": payment.get('checkout_url')
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/sms")
async def send_sms(
    to: str,
    body: str,
    from_number: str = None,
    client: OneRouter = Depends(get_onerouter_client)
):
    try:
        sms = client.sms.send(
            to=to,
            body=body,
            from_number=from_number
        )

        return {
            "message_id": sms['message_id'],
            "status": sms['status'],
            "cost": sms['cost']
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Flask Integration</h3>
        <div className="border border-gray-700 rounded p-4 mb-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# app.py
from flask import Flask, request, jsonify
from onerouter import OneRouter
import os

app = Flask(__name__)

def get_onerouter_client():
    return OneRouter(
        api_key=os.getenv('ONEROUTER_API_KEY'),
        base_url=os.getenv('ONEROUTER_BASE_URL', 'https://one-backend.stack-end.com'),
        timeout=int(os.getenv('ONEROUTER_TIMEOUT', '30')),
        max_retries=int(os.getenv('ONEROUTER_MAX_RETRIES', '3'))
    )`}
          </pre>
        </div>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`@app.route('/api/payments', methods=['POST'])
def create_payment():
    try:
        data = request.get_json()
        client = get_onerouter_client()

        payment = client.payments.create(
            amount=data['amount'],
            currency=data['currency'],
            customer_id=data['customer_id'],
            payment_method=data['payment_method']
        )

        return jsonify({
            'payment_id': payment['transaction_id'],
            'status': payment['status'],
            'checkout_url': payment.get('checkout_url')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/sms', methods=['POST'])
def send_sms():
    try:
        data = request.get_json()
        client = get_onerouter_client()

        sms = client.sms.send(
            to=data['to'],
            body=data['body'],
            from_number=data.get('from_number')
        )

        return jsonify({
            'message_id': sms['message_id'],
            'status': sms['status'],
            'cost': sms['cost']
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Testing with Test Credentials</h3>
        <div className="border border-gray-700 rounded p-4 mb-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# Test environment setup
client = OneRouter(
    api_key="unf_test_your_test_key_here",
    base_url="http://localhost:8000",  # For local development
    environment="development"
)

# Test SMS (won't actually send, but validates)
sms = client.sms.send(
    to="+1234567890",
    body="Test SMS - won't be sent"
)

# Test Email (won't actually send)
email = client.email.send(
    to="test@example.com",
    subject="Test",
    html_body="<h1>Test Email</h1>"
)

# Test Payment (won't charge real card)
payment = client.payments.create(
    amount=100,  # Small test amount
    currency="USD",
    customer_id="test_customer",
    payment_method={
        "type": "card",
        "card": {
            "number": "4242424242424242",  # Test card
            "expiry_month": "12",
            "expiry_year": "2025",
            "cvv": "123"
        }
    }
)`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Migrating from Other Providers</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">From Stripe</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`# Old Stripe code
import stripe
stripe.api_key = 'sk_test_...'
charge = stripe.Charge.create(
    amount=1000,
    currency='usd',
    source='tok_visa'
)

# New OneRouter code
from onerouter import OneRouter
client = OneRouter(api_key='unf_live_...')
payment = client.payments.create(
    amount=1000,
    currency='USD',
    payment_method={
        'type': 'card',
        'card': {
            'number': '4242424242424242',
            'expiry_month': '12',
            'expiry_year': '2025',
            'cvv': '123'
        }
    }
)`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">From Twilio</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`# Old Twilio code
from twilio.rest import Client
twilio = Client('AC...', 'token')
message = twilio.messages.create(
    body='Hello!',
    from_='+1234567890',
    to='+0987654321'
)

# New OneRouter code
from onerouter import OneRouter
client = OneRouter(api_key='unf_live_...')
sms = client.sms.send(
    to='+0987654321',
    body='Hello!',
    from_number='+1234567890'
)`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">From SendGrid/Resend</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`# Old SendGrid code
import sendgrid
sg = sendgrid.SendGridAPIClient('SG...')
email = Mail(from_email='from@example.com', to_emails='to@example.com')
sg.send(email)

# New OneRouter code
from onerouter import OneRouter
client = OneRouter(api_key='unf_live_...')
email = client.email.send(
    to='to@example.com',
    from_email='from@example.com',
    subject='Subject',
    html_body='<h1>Hello!</h1>'
)`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Production Deployment</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Docker Deployment</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
ENV ONEROUTER_API_KEY=unf_live_your_key_here
ENV ONEROUTER_BASE_URL=https://one-backend.stack-end.com

CMD ["python", "app.py"]`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Railway Deployment</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python app.py"
  }
}

# Environment variables in Railway dashboard:
ONEROUTER_API_KEY=unf_live_your_key_here
ONEROUTER_BASE_URL=https://one-backend.stack-end.com`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Vercel Deployment</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`# vercel.json
{
  "buildCommand": "pip install -r requirements.txt",
  "outputDirectory": ".",
  "framework": null,
  "functions": {
    "api/*.py": {
      "runtime": "python3"
    }
  }
}

# .env.local
ONEROUTER_API_KEY=unf_live_your_key_here
ONEROUTER_BASE_URL=https://one-backend.stack-end.com`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Advanced Features</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Idempotency Keys</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`import uuid

# Prevent duplicate payments
idempotency_key = str(uuid.uuid4())
payment = client.payments.create(
    amount=1000,
    currency='USD',
    idempotency_key=idempotency_key
)

# Same key = same payment (no duplicate)
payment2 = client.payments.create(
    amount=1000,
    currency='USD',
    idempotency_key=idempotency_key
)
assert payment['transaction_id'] == payment2['transaction_id']`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Rate Limiting</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`# SDK handles rate limiting automatically
client = OneRouter(
    api_key="unf_live_xxx",
    max_retries=5,  # Increase retries
    retry_delay=2   # Wait longer between retries
)

# Custom rate limiting in your app
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, calls_per_minute=60):
        self.calls = defaultdict(list)
        self.limit = calls_per_minute

    def can_call(self, key):
        now = time.time()
        self.calls[key] = [t for t in self.calls[key] if now - t < 60]
        return len(self.calls[key]) < self.limit

    def record_call(self, key):
        self.calls[key].append(time.time())

limiter = RateLimiter(calls_per_minute=30)  # 30 SMS per minute

if limiter.can_call('sms'):
    sms = client.sms.send(to="+1234567890", body="Hello!")
    limiter.record_call('sms')
else:
    print("Rate limit exceeded")`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Bulk Operations</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`import asyncio

async def send_bulk_sms(phone_numbers, message):
    async with OneRouter(api_key="unf_live_xxx") as client:
        tasks = [
            client.sms.send_async(to=phone, body=message)
            for phone in phone_numbers
        ]
        results = await asyncio.gather(*tasks)
        return results

# Usage
phones = ["+1234567890", "+1234567891", "+1234567892"]
results = asyncio.run(send_bulk_sms(phones, "Bulk message"))

for i, result in enumerate(results):
    print(f"SMS {i+1}: {result['message_id']}")`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SMS Section
function SMSSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">SMS Integration</h1>
        <p className="text-gray-300 leading-relaxed">
          Send SMS messages via Twilio with delivery tracking and cost optimization.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Prerequisites</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Twilio Account with phone number</li>
          <li>• API credentials configured</li>
          <li>• SMS credits in Twilio account</li>
        </ul>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Send SMS</h3>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`from onerouter import OneRouter

client = OneRouter(api_key="unf_live_xxx")

# Basic SMS
sms = client.sms.send(
    to="+1234567890",
    body="Hello from OneRouter!"
)

print("SMS sent:", sms['message_id'])
print("Status:", sms['status'])
print("Cost: $", sms['cost'])`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Get SMS Status</h3>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# Get SMS delivery status
status = client.sms.get_status("SM1234567890")
print("Status:", status['status'])
print("Sent to:", status['to'])
print("Body:", status['body'])`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Common Issues</h3>
        <div className="space-y-3 text-gray-300">
          <p><strong className="text-white">❌ Service not configured:</strong> Add Twilio credentials in dashboard</p>
          <p><strong className="text-white">❌ Invalid phone:</strong> Use E.164 format (+1234567890)</p>
          <p><strong className="text-white">❌ No credits:</strong> Add funds to Twilio account</p>
          <p><strong className="text-white">❌ Rate limited:</strong> Wait 60 seconds between messages</p>
        </div>
      </div>
    </div>
  );
}

// Email Section
function EmailSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Send Email</h1>
        <p className="text-gray-300 leading-relaxed">
          Send transactional emails via Resend with delivery tracking and analytics.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Prerequisites</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Resend Account</li>
          <li>• Verified sending domain</li>
          <li>• API key configured</li>
        </ul>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Send Email</h3>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-cyan-400 text-sm overflow-x-auto">
{`from onerouter import OneRouter

client = OneRouter(api_key="unf_live_xxx")

# UPI Payment (India)
payment = client.payments.create(
    amount=1000,  # ₹10.00
    currency="INR",
    customer_id="cust_123",
    payment_method={
        "type": "upi",
        "upi": {
            "vpa": "customer@upi"
        }
    }
)

print("Payment ID:", payment['transaction_id'])
print("Checkout URL:", payment.get('checkout_url'))`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Payments Section
function PaymentsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Payment Integration</h1>
        <p className="text-gray-300 leading-relaxed">
          Process payments with multiple providers including Razorpay, PayPal, and others.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Supported Payment Methods</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-700 rounded">
            <h4 className="text-white font-medium mb-2">🇮🇳 India</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• UPI (Virtual Payment Address)</li>
              <li>• Credit/Debit Cards (with EMI)</li>
              <li>• Net Banking</li>
              <li>• Wallets (Paytm, PhonePe, etc.)</li>
            </ul>
          </div>
          <div className="p-4 border border-gray-700 rounded">
            <h4 className="text-white font-medium mb-2">🌍 International</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Credit/Debit Cards</li>
              <li>• PayPal</li>
              <li>• Apple Pay, Google Pay</li>
              <li>• Bank transfers</li>
            </ul>
          </div>
          <div className="p-4 border border-gray-700 rounded">
            <h4 className="text-white font-medium mb-2">💰 Features</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• One-time payments</li>
              <li>• Recurring subscriptions</li>
              <li>• Refunds & chargebacks</li>
              <li>• Multi-currency support</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Create Payment</h3>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`from onerouter import OneRouter

client = OneRouter(api_key="unf_live_xxx")

# UPI Payment (India)
payment = client.payments.create(
    amount=1000,  # ₹10.00
    currency="INR",
    customer_id="cust_123",
    payment_method={
        "type": "upi",
        "upi": {
            "vpa": "customer@upi"
        }
    }
)

print("Payment ID:", payment['transaction_id'])
print("Checkout URL:", payment.get('checkout_url'))`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Payment Operations</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded p-4">
            <h4 className="text-white font-medium mb-2">Get Payment Status</h4>
            <pre className="text-white text-xs overflow-x-auto">
{`status = client.payments.get(payment['transaction_id'])
print("Status:", status['status'])  # pending, completed, failed`}
            </pre>
          </div>
          <div className="border border-gray-700 rounded p-4">
            <h4 className="text-white font-medium mb-2">Refund Payment</h4>
            <pre className="text-white text-xs overflow-x-auto">
{`refund = client.payments.refund(
    payment_id=payment['transaction_id'],
    amount=500  # Partial refund
)
print("Refund ID:", refund['refund_id'])`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subscriptions Section
function SubscriptionsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Subscriptions</h1>
        <p className="text-gray-300 leading-relaxed">
          Manage recurring subscriptions with trial periods, plan changes, and payment collection.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Advanced SMS Options</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded p-4">
            <h4 className="text-white font-medium mb-2">Custom From Number</h4>
            <pre className="text-white text-xs overflow-x-auto">
{`sms = client.sms.send(
    to="+1234567890",
    body="Custom sender",
    from_number="+0987654321"
)`}
            </pre>
          </div>
          <div className="border border-gray-700 rounded p-4">
            <h4 className="text-white font-medium mb-2">Idempotency Key</h4>
            <pre className="text-white text-xs overflow-x-auto">
{`import uuid

sms = client.sms.send(
    to="+1234567890",
    body="Idempotent message",
    idempotency_key=str(uuid.uuid4())
)`}
            </pre>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Get SMS Status</h3>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-cyan-400 text-sm overflow-x-auto">
{`from onerouter import OneRouter

client = OneRouter(api_key="unf_live_xxx")

subscription = client.subscriptions.create(
    plan_id="plan_monthly_99",
    customer_id="cust_123",
    trial_days=14,
    payment_method={
        "type": "card",
        "card": {
            "number": "4242424242424242",
            "expiry_month": "12",
            "expiry_year": "2025",
            "cvv": "123"
        }
    }
)

print("Subscription ID:", subscription['id'])
print("Status:", subscription['status'])`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// API Section
function APISection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">REST API Reference</h1>
        <p className="text-gray-300 leading-relaxed">
          Complete REST API documentation with authentication, endpoints, and integration examples.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Base URLs</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Production</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">https://one-backend.stack-end.com</code>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Development</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">http://localhost:8000/v1</code>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Production API</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">https://one-backend.stack-end.com/v1</code>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="border border-gray-700 rounded p-4">
             <pre className="text-white text-sm overflow-x-auto">
# Bearer Token Authentication
curl -H "Authorization: Bearer unf_live_your_api_key_here" \
     https://one-backend.stack-end.com/v1/sms

# Or API Key in header
curl -H "X-API-Key: unf_live_your_api_key_here" \
     https://one-backend.stack-end.com/v1/sms
             </pre>
          </div>
          <div className="text-gray-300">
            <p><strong>API Key Format:</strong> <code>unf_live_xxxxxxxxxxxxxxxxxxxxxxxx</code></p>
            <p><strong>Environment:</strong> Use <code>live</code> for production, <code>test</code> for development</p>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">SMS Endpoints</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Send SMS</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-mono">POST</span>
                <code className="text-white">/v1/sms</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -X POST https://one-backend.stack-end.com/v1/sms \\
  -H "Authorization: Bearer unf_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "body": "Hello from OneRouter!",
    "from_number": "+0987654321",
    "idempotency_key": "unique-key-123"
  }'

# Response
{
  "message_id": "SM1234567890",
  "status": "sent",
  "service": "twilio",
  "cost": 0.0079,
  "currency": "USD",
  "created_at": "2025-01-01T12:00:00Z"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Get SMS Status</h4>
            <div className="border border-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-mono">GET</span>
                <code className="text-white">/v1/sms/{'{message_id}'}</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer unf_live_xxx" \\
     https://one-backend.stack-end.com/v1/sms/SM1234567890

# Response
{
  "message_id": "SM1234567890",
  "status": "delivered",
  "to": "+1234567890",
  "from": "+0987654321",
  "body": "Hello from OneRouter!",
  "cost": 0.0079,
  "created_at": "2025-01-01T12:00:00Z"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Email Endpoints</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Send Email</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-mono">POST</span>
                <code className="text-white">/v1/email</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -X POST https://one-backend.stack-end.com/v1/email \\
  -H "Authorization: Bearer unf_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "subject": "Welcome to OneRouter",
    "html_body": "<h1>Welcome!</h1><p>Your account is ready.</p>",
    "text_body": "Welcome to OneRouter! Your account is ready.",
    "idempotency_key": "unique-key-456"
  }'

# Response
{
  "email_id": "email_123",
  "status": "sent",
  "service": "resend",
  "cost": 0.0001,
  "currency": "USD",
  "created_at": "2025-01-01T12:00:00Z"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Get Email Status</h4>
            <div className="border border-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-mono">GET</span>
                <code className="text-white">/v1/email/{'{email_id}'}</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer unf_live_xxx" \\
     https://one-backend.stack-end.com/v1/email/email_123

# Response
{
  "email_id": "email_123",
  "status": "delivered",
  "to": "user@example.com",
  "subject": "Welcome to OneRouter",
  "cost": 0.0001,
  "created_at": "2025-01-01T12:00:00Z"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Payment Endpoints</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Create Payment</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-mono">POST</span>
                <code className="text-white">/v1/payments</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -X POST https://one-backend.stack-end.com/v1/payments \\
  -H "Authorization: Bearer unf_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000,
    "currency": "INR",
    "customer_id": "cust_123",
    "payment_method": {
      "type": "upi",
      "upi": {"vpa": "customer@upi"}
    },
    "idempotency_key": "unique-pay-123"
  }'

# Response
{
  "transaction_id": "txn_123",
  "status": "pending",
  "amount": 1000,
  "currency": "INR",
  "checkout_url": "https://checkout.onerouter.com/pay/xyz123",
  "provider": "razorpay"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Get Payment</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-mono">GET</span>
                <code className="text-white">/v1/payments/{'{transaction_id}'}</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer unf_live_xxx" \\
     https://one-backend.stack-end.com/v1/payments/txn_123

# Response
{
  "transaction_id": "txn_123",
  "status": "completed",
  "amount": 1000,
  "currency": "INR",
  "provider_txn_id": "pay_xyz",
  "created_at": "2025-01-01T12:00:00Z"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Refund Payment</h4>
            <div className="border border-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-mono">POST</span>
                <code className="text-white">/v1/payments/{'{transaction_id}'}/refund</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -X POST https://one-backend.stack-end.com/v1/payments/txn_123/refund \\
  -H "Authorization: Bearer unf_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500,
    "reason": "Customer requested refund"
  }'

# Response
{
  "refund_id": "ref_123",
  "status": "processed",
  "amount": 500,
  "currency": "INR"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Subscription Endpoints</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Create Subscription</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-mono">POST</span>
                <code className="text-white">/v1/subscriptions</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -X POST https://one-backend.stack-end.com/v1/subscriptions \\
  -H "Authorization: Bearer unf_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "plan_id": "plan_monthly_99",
    "customer_id": "cust_123",
    "trial_days": 14,
    "payment_method": {
      "type": "card",
      "card": {
        "number": "4242424242424242",
        "expiry_month": "12",
        "expiry_year": "2025",
        "cvv": "123"
      }
    }
  }'

# Response
{
  "subscription_id": "sub_123",
  "status": "trial",
  "trial_end": "2025-01-15T12:00:00Z",
  "amount": 999,
  "currency": "INR"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Get Subscription</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-mono">GET</span>
                <code className="text-white">/v1/subscriptions/{'{subscription_id}'}</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer unf_live_xxx" \\
     https://one-backend.stack-end.com/v1/subscriptions/sub_123`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Pause/Cancel Subscription</h4>
            <div className="border border-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-400 font-mono">POST</span>
                <code className="text-white">/v1/subscriptions/{'{subscription_id}'}/pause</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`# Pause
curl -X POST https://one-backend.stack-end.com/v1/subscriptions/sub_123/pause \\
  -H "Authorization: Bearer unf_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"pause_at": "cycle_end"}'

# Resume
curl -X POST https://one-backend.stack-end.com/v1/subscriptions/sub_123/resume \\
  -H "Authorization: Bearer unf_live_xxx"

# Cancel
curl -X DELETE https://one-backend.stack-end.com/v1/subscriptions/sub_123 \\
  -H "Authorization: Bearer unf_live_xxx"`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Service Discovery</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">List Services</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-mono">GET</span>
                <code className="text-white">/v1/services</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer unf_live_xxx" \\
     https://one-backend.stack-end.com/v1/services

# Response
{
  "services": [
    {
      "name": "twilio",
      "category": "communications",
      "subcategory": "sms",
      "features": ["send_sms", "get_sms"],
      "pricing": {
        "send_sms": {"base": 0.0079, "unit": "per_message"}
      }
    }
  ]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Get Service Schema</h4>
            <div className="border border-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-mono">GET</span>
                <code className="text-white">/v1/services/{'{service_name}'}/schema</code>
              </div>
              <pre className="text-white text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer unf_live_xxx" \\
     https://one-backend.stack-end.com/v1/services/twilio/schema`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Error Responses</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-red-400 font-medium mb-2">400 Bad Request</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <pre className="text-white text-sm overflow-x-auto">
{`{
  "detail": "Validation error: Invalid phone number format",
  "errors": [
    {
      "field": "to",
      "message": "Phone number must be in E.164 format"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-red-400 font-medium mb-2">401 Unauthorized</h4>
            <div className="border border-gray-700 rounded p-4 mb-4">
              <pre className="text-white text-sm overflow-x-auto">
{`{
  "detail": "Invalid API key"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-yellow-400 font-medium mb-2">429 Rate Limited</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`{
  "detail": "Rate limit exceeded",
  "retry_after": 60,
  "limit": "100 requests per minute"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Rate Limits</h3>
        <div className="text-gray-300 space-y-2">
          <div className="flex justify-between">
            <span>SMS sending</span>
            <span className="text-cyan-400">10 requests/second</span>
          </div>
          <div className="flex justify-between">
            <span>Email sending</span>
            <span className="text-cyan-400">10 requests/second</span>
          </div>
          <div className="flex justify-between">
            <span>Payment creation</span>
            <span className="text-cyan-400">5 requests/second</span>
          </div>
          <div className="flex justify-between">
            <span>Status queries</span>
            <span className="text-cyan-400">20 requests/second</span>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-4">
          Rate limits are applied per API key. Requests exceeding limits return HTTP 429.
        </p>
      </div>
    </div>
  );
}

// JavaScript SDK Section
function JSSDKSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">JavaScript SDK</h1>
        <p className="text-gray-300 leading-relaxed">
          Complete integration guide for the OneRouter JavaScript SDK. Everything you need to integrate payments, SMS, email, and subscriptions in Node.js, browser, and edge environments.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Installation</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">npm</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">npm install onerouterjs-sdk</code>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">yarn</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">yarn add onerouterjs-sdk</code>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">pnpm</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">pnpm add onerouterjs-sdk</code>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Base URLs & Environments</h3>
        <div className="space-y-4">
           <div>
             <h4 className="text-white font-medium mb-2">Production</h4>
             <div className="border border-gray-700 rounded p-3">
               <code className="text-white">https://one-backend.stack-end.com</code>
             </div>
           </div>
          <div>
            <h4 className="text-white font-medium mb-2">Development</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">http://localhost:8000</code>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Custom Environment</h4>
            <div className="border border-gray-700 rounded p-3">
              <code className="text-white">https://your-domain.com</code>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Complete SDK Setup</h3>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`import { OneRouter } from 'onerouterjs-sdk';

// Production Setup
const client = new OneRouter({
  apiKey: 'unf_live_your_production_key_here',
  baseURL: 'https://one-backend.stack-end.com',
  timeout: 30000,
  maxRetries: 3,
  environment: 'production'
});

// Development Setup
const client = new OneRouter({
  apiKey: 'unf_test_your_test_key_here',
  baseURL: 'http://localhost:8000',
  timeout: 60000,
  maxRetries: 5,
  environment: 'development'
});

// Custom Environment
const client = new OneRouter({
  apiKey: 'unf_live_your_key_here',
  baseURL: 'https://api.yourdomain.com',
  timeout: 45000,
  maxRetries: 3
});`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Environment Variables</h3>
        <div className="border border-gray-700 rounded p-4 mb-4">
          <pre className="text-white text-sm overflow-x-auto">
{`# .env file
ONEROUTER_API_KEY=unf_live_your_key_here
ONEROUTER_BASE_URL=https://one-backend.stack-end.com
ONEROUTER_TIMEOUT=30000
ONEROUTER_MAX_RETRIES=3
ONEROUTER_ENVIRONMENT=production`}
          </pre>
        </div>
        <div className="border border-gray-700 rounded p-4">
          <pre className="text-white text-sm overflow-x-auto">
{`// JavaScript code using environment variables
import { OneRouter } from 'onerouterjs-sdk';

const client = new OneRouter({
  apiKey: process.env.ONEROUTER_API_KEY,
  baseURL: process.env.ONEROUTER_BASE_URL || 'https://one-backend.stack-end.com',
  timeout: parseInt(process.env.ONEROUTER_TIMEOUT) || 30000,
  maxRetries: parseInt(process.env.ONEROUTER_MAX_RETRIES) || 3
});`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">SMS Integration</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium mb-2">Send SMS</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`import { OneRouter } from 'onerouterjs-sdk';

const client = new OneRouter({
  apiKey: 'unf_live_xxx'
});

// Basic SMS
const sms = await client.sms.send({
  to: '+1234567890',
  body: 'Hello from OneRouter!'
});

console.log('SMS sent:', sms.message_id);
console.log('Status:', sms.status);
console.log('Cost: $', sms.cost);`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Advanced SMS Options</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// Custom from number
const sms = await client.sms.send({
  to: '+1234567890',
  body: 'Custom sender message',
  from_number: '+0987654321'
});

// With idempotency key
const sms = await client.sms.send({
  to: '+1234567890',
  body: 'Idempotent message',
  idempotency_key: crypto.randomUUID()
});

// Get SMS status
const status = await client.sms.get('SM1234567890');
console.log('Status:', status.status);
console.log('To:', status.to);
console.log('Body:', status.body);`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Email Integration</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium mb-2">Send Email</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`import { OneRouter } from 'onerouterjs-sdk';

const client = new OneRouter({
  apiKey: 'unf_live_xxx'
});

// HTML Email
const email = await client.email.send({
  to: 'user@example.com',
  subject: 'Welcome to OneRouter',
  html_body: '<h1>Welcome!</h1><p>Your account is ready.</p>',
  text_body: 'Welcome to OneRouter! Your account is ready.'
});

console.log('Email sent:', email.email_id);
console.log('Status:', email.status);
console.log('Cost: $', email.cost);`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Email with Attachments</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// Email with attachments (Node.js)
const fs = require('fs');
const email = await client.email.send({
  to: 'user@example.com',
  subject: 'Invoice Attached',
  html_body: '<h1>Your Invoice</h1><p>Please find your invoice attached.</p>',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: fs.readFileSync('invoice.pdf'),
      content_type: 'application/pdf'
    }
  ]
});`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Get Email Status</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`const status = await client.email.get('email_123');
console.log('Status:', status.status);
console.log('To:', status.to);
console.log('Subject:', status.subject);`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Payment Integration</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium mb-2">Supported Payment Methods</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-700 rounded p-4">
                <h5 className="text-white font-medium mb-2">Cards</h5>
                <pre className="text-white text-xs overflow-x-auto">
{`const payment = await client.payments.create({
  amount: 1000,  // $10.00
  currency: 'USD',
  method: 'card',
  // Card details would be handled by the payment provider
  // This is just an example of the API structure
});`}
                </pre>
              </div>
              <div className="border border-gray-700 rounded p-4">
                <h5 className="text-white font-medium mb-2">UPI (India)</h5>
                <pre className="text-white text-xs overflow-x-auto">
{`const payment = await client.payments.create({
  amount: 1000,  // ₹10.00
  currency: 'INR',
  method: 'upi',
  upi_app: 'customer@upi'
});`}
                </pre>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Payment Operations</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-700 rounded p-4">
                <h5 className="text-white font-medium mb-2">Get Payment Status</h5>
                <pre className="text-white text-xs overflow-x-auto">
{`const status = await client.payments.get('txn_123');
console.log('Status:', status.status);  // pending, completed, failed`}
                </pre>
              </div>
              <div className="border border-gray-700 rounded p-4">
                <h5 className="text-white font-medium mb-2">Refund Payment</h5>
                <pre className="text-white text-xs overflow-x-auto">
{`const refund = await client.payments.refund('txn_123', {
  amount: 500  // Partial refund
});
console.log('Refund ID:', refund.refund_id);`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Subscription Management</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium mb-2">Create Subscription</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`const subscription = await client.subscriptions.create({
  plan_id: 'plan_monthly_99',
  trial_days: 14,
  customer_notify: true,
  total_count: 12,
  quantity: 1
});`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Subscription Operations</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-700 rounded p-4">
                <h5 className="text-white font-medium mb-2">Get Subscription</h5>
                <pre className="text-white text-xs overflow-x-auto">
{`const sub = await client.subscriptions.get('sub_123');
console.log('Status:', sub.status);`}
                </pre>
              </div>
              <div className="border border-gray-700 rounded p-4">
                <h5 className="text-white font-medium mb-2">Pause Subscription</h5>
                <pre className="text-white text-xs overflow-x-auto">
{`await client.subscriptions.pause('sub_123', {
  pause_at: 'cycle_end'
});`}
                </pre>
              </div>
              <div className="border border-gray-700 rounded p-4">
                <h5 className="text-white font-medium mb-2">Cancel Subscription</h5>
                <pre className="text-white text-xs overflow-x-auto">
{`await client.subscriptions.cancel('sub_123');`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Framework Integration</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium mb-2">Next.js API Route</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// pages/api/payments.js
import { OneRouter } from 'onerouterjs-sdk';

const client = new OneRouter({
  apiKey: process.env.ONEROUTER_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, method } = req.body;

    const payment = await client.payments.create({
      amount,
      currency,
      method
    });

    res.status(200).json({
      payment_id: payment.transaction_id,
      status: payment.status,
      checkout_url: payment.checkout_url
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Express.js Server</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// server.js
const express = require('express');
const { OneRouter } = require('onerouterjs-sdk');

const app = express();
app.use(express.json());

const client = new OneRouter({
  apiKey: process.env.ONEROUTER_API_KEY
});

app.post('/api/payments', async (req, res) => {
  try {
    const { amount, currency, method } = req.body;

    const payment = await client.payments.create({
      amount,
      currency,
      method
    });

    res.json({
      payment_id: payment.transaction_id,
      status: payment.status,
      checkout_url: payment.checkout_url
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Vercel Edge Function</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// api/payments.js
import { OneRouter } from 'onerouterjs-sdk';

const client = new OneRouter({
  apiKey: process.env.ONEROUTER_API_KEY
});

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { amount, currency, method } = await request.json();

    const payment = await client.payments.create({
      amount,
      currency,
      method
    });

    return new Response(JSON.stringify({
      payment_id: payment.transaction_id,
      status: payment.status,
      checkout_url: payment.checkout_url
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Error Handling</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Try/Catch Error Handling</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`try {
  const payment = await client.payments.create({
    amount: 1000,
    currency: 'USD',
    method: 'card'
  });
} catch (error) {
  console.error('Payment failed:', error.message);

  // Handle specific error types
  if (error.code === 'VALIDATION_ERROR') {
    // Handle validation errors
    console.log('Validation errors:', error.details);
  } else if (error.code === 'PAYMENT_DECLINED') {
    // Handle payment declined
    console.log('Payment was declined');
  } else if (error.code === 'RATE_LIMITED') {
    // Handle rate limiting
    const retryAfter = error.retry_after;
    console.log('Rate limited, retry after ' + retryAfter + ' seconds');
  }
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Async Error Handling</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// Using promises with .catch()
client.sms.send({
  to: '+1234567890',
  body: 'Hello!'
})
.then(sms => {
  console.log('SMS sent:', sms.message_id);
})
.catch(error => {
  if (error.code === 'INVALID_PHONE') {
    console.error('Invalid phone number format');
  } else if (error.code === 'SERVICE_UNAVAILABLE') {
    console.error('SMS service is currently unavailable');
  } else {
    console.error('Unexpected error:', error.message);
  }
});

// Using async/await with try/catch
async function sendSMS() {
  try {
    const sms = await client.sms.send({
      to: '+1234567890',
      body: 'Hello!'
    });
    return sms;
  } catch (error) {
    // Log error and retry logic here
    throw error;
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Testing with Test Credentials</h3>
        <div className="border border-gray-700 rounded p-4 mb-4">
          <pre className="text-white text-sm overflow-x-auto">
{`// Test environment setup
const client = new OneRouter({
  apiKey: 'unf_test_your_test_key_here',
  baseURL: 'http://localhost:8000',
  environment: 'development'
});

// Test SMS (won't actually send)
const sms = await client.sms.send({
  to: '+1234567890',
  body: 'Test SMS - won\\'t be sent'
});

// Test Email (won't actually send)
const email = await client.email.send({
  to: 'test@example.com',
  subject: 'Test',
  html_body: '<h1>Test Email</h1>'
});

// Test Payment (won't charge real card)
const payment = await client.payments.create({
  amount: 100,
  currency: 'USD',
  customer_id: 'test_customer',
  payment_method: {
    type: 'card',
    card: {
      number: '4242424242424242',  // Test card
      expiry_month: '12',
      expiry_year: '2025',
      cvv: '123'
    }
  }
});`}
          </pre>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Production Deployment</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Vercel Deployment</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// vercel.json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "ONEROUTER_API_KEY": "@onerouter-api-key"
  }
}

// .env.local (for local development)
ONEROUTER_API_KEY=unf_live_your_key_here
ONEROUTER_BASE_URL=https://one-backend.stack-end.com`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Railway Deployment</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-sm overflow-x-auto">
{`// package.json
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "onerouterjs-sdk": "^1.0.0",
    "express": "^4.18.0"
  }
}

// Environment variables in Railway dashboard:
ONEROUTER_API_KEY=unf_live_your_key_here
ONEROUTER_BASE_URL=https://one-backend.stack-end.com`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Advanced Features</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Idempotency Keys</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`// Prevent duplicate payments
const idempotencyKey = crypto.randomUUID();
const payment = await client.payments.create({
  amount: 1000,
  currency: 'USD',
  idempotency_key: idempotencyKey
});

// Same key = same payment (no duplicate)
const payment2 = await client.payments.create({
  amount: 1000,
  currency: 'USD',
  idempotency_key: idempotencyKey
});
console.log(payment.transaction_id === payment2.transaction_id); // true`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Rate Limiting</h4>
            <div className="border border-gray-700 rounded p-4">
              <pre className="text-white text-xs overflow-x-auto">
{`// SDK handles rate limiting automatically
const client = new OneRouter({
  apiKey: 'unf_live_xxx',
  maxRetries: 5,
  retryDelay: 2000  // Wait longer between retries
});

// Custom rate limiting in your app
class RateLimiter {
  constructor(callsPerMinute = 60) {
    this.calls = new Map();
    this.limit = callsPerMinute;
  }

  canCall(key) {
    const now = Date.now();
    const window = 60 * 1000; // 1 minute
    const calls = this.calls.get(key) || [];

    // Remove old calls
    const recentCalls = calls.filter(time => now - time < window);
    this.calls.set(key, recentCalls);

    return recentCalls.length < this.limit;
  }

  recordCall(key) {
    const calls = this.calls.get(key) || [];
    calls.push(Date.now());
    this.calls.set(key, calls);
  }
}

const limiter = new RateLimiter(30); // 30 SMS per minute

if (limiter.canCall('sms')) {
  const sms = await client.sms.send({ to: '+1234567890', body: 'Hello!' });
  limiter.recordCall('sms');
} else {
  console.log('Rate limit exceeded');
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Troubleshooting Section
function TroubleshootingSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Troubleshooting</h1>
        <p className="text-gray-300 leading-relaxed">
          Common issues and their solutions when integrating with OneRouter.
        </p>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">SDK Installation Issues</h3>
          <div className="space-y-3 text-gray-300">
            <p><strong className="text-white">❌ Module not found:</strong> <code className="text-white">pip install onerouter==2.0.1</code></p>
            <p><strong className="text-white">❌ Version mismatch:</strong> <code className="text-white">pip install --upgrade onerouter</code></p>
            <p><strong className="text-white">❌ Permission error:</strong> <code className="text-white">pip install --user onerouter</code></p>
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Authentication Errors</h3>
          <div className="space-y-3 text-gray-300">
            <p><strong className="text-white">❌ Invalid API key:</strong> Check your API key in dashboard</p>
            <p><strong className="text-white">❌ API key expired:</strong> Generate new key in dashboard</p>
            <p><strong className="text-white">❌ Wrong environment:</strong> Use &apos;live&apos; keys for production</p>
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">SMS Issues</h3>
          <div className="space-y-3 text-gray-300">
            <p><strong className="text-red-400">❌ Service not configured:</strong> Add Twilio credentials in dashboard</p>
            <p><strong className="text-red-400">❌ Invalid phone:</strong> Use E.164 format (+1234567890)</p>
            <p><strong className="text-red-400">❌ No credits:</strong> Add funds to Twilio account</p>
            <p><strong className="text-red-400">❌ Rate limited:</strong> Wait 60 seconds between messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}