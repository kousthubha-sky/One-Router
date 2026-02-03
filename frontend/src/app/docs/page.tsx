'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Github, ExternalLink, Copy, Check } from 'lucide-react';

function CodeBlock({
  code,
  language = 'bash',
  id,
  copied,
  onCopy
}: {
  code: string;
  language?: string;
  id: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[#666] text-xs uppercase tracking-widest">{language}</span>
        <button
          onClick={() => onCopy(code, id)}
          className="text-[#666] hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {copied === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === id ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-[#00ff88] text-xs overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copied, setCopied] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'authentication', title: 'Authentication' },
    { id: 'endpoints', title: 'Endpoints' },
    { id: 'examples', title: 'Examples' },
    { id: 'errors', title: 'Errors' },
    { id: 'sdk', title: 'SDKs' },
  ];

  const apiBaseUrl = 'https://one-backend.stack-end.com';
  const swaggerUrl = `${apiBaseUrl}/docs`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      {/* Modern Navbar */}
        <header className="sticky top-0 z-50 bg-black border-b border-[#222]">
          <div className="w-full h-16 flex items-center border-l border-r border-[#222] relative">
            {/* Vertical gridlines - hidden on mobile */}
            <div className="absolute inset-0 flex pointer-events-none hidden md:flex">
              <div className="flex-1 border-r border-[#222]"></div>
              <div className="flex-1 border-r border-[#222]"></div>
              <div className="flex-1 border-r border-[#222]"></div>
            </div>

            <div className="w-full h-full flex justify-between items-center px-4 md:px-8 relative z-10">
              {/* Left - Logo */}
              <div className="flex items-center gap-2 border-r border-[#222] pr-4 md:pr-8 flex-1">
                <div className="w-8 h-8 bg-gradient-to-br from-black  to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-cyan-500/25 hover:scale-110">
                  </div>
                <div className="font-bold text-sm md:text-lg font-mono">
                  
                  <span className="text-white">ONE</span>
                  <span className="text-cyan-400">ROUTER</span>
                </div>
              </div>

              {/* Middle - Navigation Links */}
              <nav className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-12 border-r border-[#222] px-4 xl:px-8">
                 <Link href="/docs" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">
                   docs
                 </Link>
                 <a href="/privacy" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">
                   privacy
                 </a>
                 <a href="/terms" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">
                   terms
                 </a>
                 <Link href="/pricing" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">
                   pricing
                 </Link>
                 <a href="/contact" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">
                   contact
                 </a>
                 
               </nav>

              {/* Right - Auth & GitHub */}
              <div className="flex items-center gap-2 md:gap-4 lg:gap-6 justify-end flex-1 pl-4 md:pl-8">
                <a href="https://github.com" className="text-[#888] hover:text-white transition-all duration-300 hover:scale-110">
                  <Github className="w-4 md:w-5 h-4 md:h-5" />
                </a>

                <SignedOut>
                  <SignInButton mode="modal">
                    <Button className="bg-white text-black hover:bg-gray-200 font-mono font-bold text-xs md:text-sm px-3 md:px-6 py-2 rounded transition-all duration-300 transform hover:scale-105 hidden sm:block">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button className="bg-white text-black hover:bg-gray-200 font-mono font-bold text-xs md:text-sm px-3 md:px-6 py-2 rounded transition-all duration-300 transform hover:scale-105 hidden sm:block">
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton />
                </SignedIn>

                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-[#888] hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu - Dropdown */}
             {mobileMenuOpen && (
               <div className="lg:hidden absolute top-16 left-0 right-0 bg-black border-b border-[#222] px-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                 <Link href="/docs" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">
                   docs
                 </Link>
                 <Link href="/privacy" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">
                   privacy
                 </Link>
                 <Link href="/terms" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">
                   terms
                 </Link>
                 <Link href="/pricing" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">
                   pricing
                 </Link>
                 <Link href="/contact" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">
                   contact
                 </Link>
               </div>
             )}
          </div>
        </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block w-64 border-r border-[#222] bg-[#050505] sticky top-16 h-[calc(100vh-4rem)]">
          <nav className="p-6 space-y-2 overflow-y-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded transition-colors text-sm font-mono ${
                  activeSection === section.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 max-w-4xl">
          {/* Mobile Section Selector */}
          <div className="md:hidden mb-6">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-4 py-2 text-white font-mono text-sm"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">OneRouter API</h1>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  A unified API gateway for payments, SMS, and email. Route requests to your own provider accounts with a single, consistent interface.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <p className="text-blue-300 font-mono text-sm">
                    <strong>Base URL:</strong> {apiBaseUrl}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href={swaggerUrl} target="_blank">
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700 font-mono flex items-center justify-center gap-2">
                      Interactive API Docs <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button className="w-full bg-gray-700 hover:bg-gray-600 font-mono">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Payments', desc: 'Razorpay, PayPal' },
                    { title: 'SMS', desc: 'Twilio' },
                    { title: 'Email', desc: 'Resend' },
                    { title: 'Multi-Tenant', desc: 'Isolated credentials' },
                    { title: 'Test & Live', desc: 'Environment switching' },
                    { title: 'Analytics', desc: 'Usage tracking' },
                  ].map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4"
                    >
                      <h3 className="text-cyan-400 font-mono font-bold mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-[#888] text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Authentication */}
          {activeSection === 'authentication' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Authentication</h1>
                <p className="text-gray-400 mb-6">
                  All API requests require authentication using Bearer tokens.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Authorization Header</h2>
                <p className="text-gray-400 mb-4">
                  Include your API key in the Authorization header:
                </p>
                <CodeBlock
                  code="Authorization: Bearer sk_test_xxxxx"
                  language="text"
                  id="auth-header"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
                <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 mb-4">
                  <p className="text-gray-400 mb-3">
                    Rate limits are applied per API key or IP address:
                  </p>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unauthenticated:</span>
                      <span className="text-cyan-400">30 requests/minute</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Authenticated:</span>
                      <span className="text-cyan-400">100 requests/minute</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Rate limit information is included in response headers:
                </p>
                <CodeBlock
                  code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704067200
Retry-After: 60`}
                  language="text"
                  id="rate-limit-headers"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
          )}

          {/* Endpoints */}
          {activeSection === 'endpoints' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">API Endpoints</h1>
                <p className="text-gray-400 mb-6">
                  Complete list of available endpoints organized by category.
                </p>
              </div>

              {[
                {
                  category: 'Payments',
                  endpoints: [
                    { method: 'POST', path: '/v1/payments/orders', desc: 'Create payment order' },
                    { method: 'GET', path: '/v1/subscriptions', desc: 'List subscriptions' },
                    { method: 'POST', path: '/v1/subscriptions', desc: 'Create subscription' },
                    { method: 'POST', path: '/v1/subscriptions/{id}/cancel', desc: 'Cancel subscription' },
                    { method: 'POST', path: '/v1/subscriptions/{id}/pause', desc: 'Pause subscription' },
                    { method: 'POST', path: '/v1/subscriptions/{id}/resume', desc: 'Resume subscription' },
                    { method: 'POST', path: '/v1/payment-links', desc: 'Create payment link' },
                  ],
                },
                {
                  category: 'Communications',
                  endpoints: [
                    { method: 'POST', path: '/v1/sms', desc: 'Send SMS' },
                    { method: 'GET', path: '/v1/sms/{id}', desc: 'Get SMS status' },
                    { method: 'POST', path: '/v1/email', desc: 'Send email' },
                    { method: 'GET', path: '/v1/email/{id}', desc: 'Get email status' },
                  ],
                },
                {
                  category: 'Services',
                  endpoints: [
                    { method: 'GET', path: '/api/services', desc: 'List connected services' },
                    { method: 'POST', path: '/api/services/{name}/credentials', desc: 'Add credentials' },
                    { method: 'PUT', path: '/api/services/{name}/credentials', desc: 'Update credentials' },
                    { method: 'DELETE', path: '/api/services/{name}', desc: 'Disconnect service' },
                    { method: 'GET', path: '/api/services/{name}/status', desc: 'Get status' },
                  ],
                },
                {
                  category: 'API Keys',
                  endpoints: [
                    { method: 'POST', path: '/api/keys', desc: 'Create API key' },
                    { method: 'GET', path: '/api/keys', desc: 'List API keys' },
                    { method: 'PATCH', path: '/api/keys/{id}', desc: 'Update API key' },
                    { method: 'DELETE', path: '/api/keys/{id}', desc: 'Delete API key' },
                  ],
                },
                {
                  category: 'Credits',
                  endpoints: [
                    { method: 'GET', path: '/api/credits/balance', desc: 'Get balance' },
                    { method: 'POST', path: '/api/credits/purchase', desc: 'Purchase credits' },
                    { method: 'GET', path: '/api/credits/plans', desc: 'List plans' },
                    { method: 'GET', path: '/api/credits/transactions', desc: 'Transaction history' },
                  ],
                },
                {
                  category: 'Analytics',
                  endpoints: [
                    { method: 'GET', path: '/api/analytics/overview', desc: 'Overview stats' },
                    { method: 'GET', path: '/api/analytics/logs', desc: 'API logs' },
                    { method: 'GET', path: '/api/analytics/costs', desc: 'Cost breakdown' },
                    { method: 'GET', path: '/api/analytics/errors', desc: 'Error logs' },
                    { method: 'GET', path: '/api/analytics/timeseries', desc: 'Time series data' },
                  ],
                },
              ].map((group, idx) => (
                <div key={idx}>
                  <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">
                    {group.category}
                  </h2>
                  <div className="space-y-2">
                    {group.endpoints.map((endpoint, endIdx) => (
                      <div
                        key={endIdx}
                        className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 flex items-start gap-4"
                      >
                        <span className="font-mono font-bold text-[#00ff88] text-sm whitespace-nowrap">
                          {endpoint.method}
                        </span>
                        <div className="flex-1">
                          <p className="font-mono text-sm text-gray-300 mb-1">
                            {endpoint.path}
                          </p>
                          <p className="text-[#888] text-sm">{endpoint.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  💡 For complete endpoint documentation with schemas and try-it-out, visit the{' '}
                  <Link href={swaggerUrl} target="_blank" className="underline hover:no-underline">
                    Interactive API Docs
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Examples */}
          {activeSection === 'examples' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Examples</h1>
                <p className="text-gray-400 mb-6">
                  Real-world examples using the OneRouter API.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Create Payment Order</h2>
                <CodeBlock
                  code={`curl -X POST ${apiBaseUrl}/v1/payments/orders \\
  -H "Authorization: Bearer sk_test_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "razorpay",
    "amount": 10000,
    "currency": "INR",
    "customer_id": "cust_123",
    "description": "Product purchase"
  }'`}
                  language="bash"
                  id="example-payment"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Create Subscription</h2>
                <CodeBlock
                  code={`curl -X POST ${apiBaseUrl}/v1/subscriptions \\
  -H "Authorization: Bearer sk_test_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "razorpay",
    "customer_id": "cust_123",
    "plan_id": "plan_monthly",
    "quantity": 1
  }'`}
                  language="bash"
                  id="example-subscription"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Send SMS</h2>
                <CodeBlock
                  code={`curl -X POST ${apiBaseUrl}/v1/sms \\
  -H "Authorization: Bearer sk_test_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "twilio",
    "to": "+919876543210",
    "message": "Your OTP is 123456"
  }'`}
                  language="bash"
                  id="example-sms"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Send Email</h2>
                <CodeBlock
                  code={`curl -X POST ${apiBaseUrl}/v1/email \\
  -H "Authorization: Bearer sk_test_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "resend",
    "to": "user@example.com",
    "subject": "Welcome!",
    "html": "<h1>Welcome to OneRouter</h1>"
  }'`}
                  language="bash"
                  id="example-email"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Get Credit Balance</h2>
                <CodeBlock
                  code={`curl -X GET ${apiBaseUrl}/api/credits/balance \\
  -H "Authorization: Bearer sk_test_xxxxx"`}
                  language="bash"
                  id="example-balance"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
          )}

          {/* Errors */}
          {activeSection === 'errors' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Error Responses</h1>
                <p className="text-gray-400 mb-6">
                  All errors return consistent JSON error responses with status codes and error codes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Error Format</h2>
                <CodeBlock
                  code={`{
  "error": "error_code",
  "message": "Human readable error message",
  "request_id": "req_xxxxx",
  "timestamp": "2024-01-27T10:00:00Z"
}`}
                  language="json"
                  id="error-format"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Common Status Codes</h2>
                <div className="space-y-3">
                  {[
                    { code: '400', desc: 'Bad Request - Invalid parameters' },
                    { code: '401', desc: 'Unauthorized - Invalid or missing API key' },
                    { code: '404', desc: 'Not Found - Resource does not exist' },
                    { code: '429', desc: 'Too Many Requests - Rate limit exceeded' },
                    { code: '500', desc: 'Server Error - Internal server error' },
                  ].map((error, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 flex items-start gap-4"
                    >
                      <span className="font-mono font-bold text-red-400 text-sm whitespace-nowrap">
                        {error.code}
                      </span>
                      <p className="text-gray-400 text-sm">{error.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Rate Limit Error</h2>
                <CodeBlock
                  code={`{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60,
  "request_id": "req_xxxxx",
  "timestamp": "2024-01-27T10:00:00Z"
}`}
                  language="json"
                  id="error-rate-limit"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
          )}

          {/* SDKs */}
          {activeSection === 'sdk' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">SDKs</h1>
                <p className="text-gray-400 mb-6">
                  Official SDKs available for Python and JavaScript.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Python SDK</h2>
                <CodeBlock
                  code="pip install onerouter"
                  language="bash"
                  id="sdk-python-install"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
                <CodeBlock
                  code={`from onerouter import OneRouter

client = OneRouter(api_key="sk_test_xxxxx")

# Create payment
response = client.payments.create_order(
    provider="razorpay",
    amount=10000,
    currency="INR",
    customer_id="cust_123"
)

# Send SMS
response = client.sms.send(
    provider="twilio",
    to="+919876543210",
    message="Your OTP is 123456"
)

# Send Email
response = client.email.send(
    provider="resend",
    to="user@example.com",
    subject="Welcome!",
    html="<h1>Welcome</h1>"
)`}
                  language="python"
                  id="sdk-python-example"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">JavaScript SDK</h2>
                <CodeBlock
                  code="npm install onerouter-js"
                  language="bash"
                  id="sdk-js-install"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
                <CodeBlock
                  code={`import { OneRouter } from 'onerouter-js';

const client = new OneRouter({ apiKey: 'sk_test_xxxxx' });

// Create payment
const payment = await client.payments.createOrder({
  provider: 'razorpay',
  amount: 10000,
  currency: 'INR',
  customer_id: 'cust_123'
});

// Send SMS
const sms = await client.sms.send({
  provider: 'twilio',
  to: '+919876543210',
  message: 'Your OTP is 123456'
});

// Send Email
const email = await client.email.send({
  provider: 'resend',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome</h1>'
});`}
                  language="javascript"
                  id="sdk-js-example"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 text-sm">
                  ✓ Both SDKs support async/await and have full type hints for IDE autocomplete.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
