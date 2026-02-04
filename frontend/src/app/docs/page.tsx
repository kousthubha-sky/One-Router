'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Github, ExternalLink, Copy, Check, Menu } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  category?: string;
}

const allSections: Section[] = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'quickstart', title: 'Quick Start' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'razorpay-setup', title: 'Razorpay Setup', category: 'providers' },
  { id: 'paypal-setup', title: 'PayPal Setup', category: 'providers' },
  { id: 'twilio-setup', title: 'Twilio Setup', category: 'providers' },
  { id: 'resend-setup', title: 'Resend Setup', category: 'providers' },
  { id: 'payments', title: 'Payments' },
  { id: 'payment-links', title: 'Payment Links' },
  { id: 'subscriptions', title: 'Subscriptions' },
  { id: 'sms', title: 'SMS' },
  { id: 'email', title: 'Email' },
  { id: 'webhooks', title: 'Webhooks' },
  { id: 'errors', title: 'Errors' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
  { id: 'sdks', title: 'SDKs' },
];

// CodeBlock component - defined outside to avoid recreation during render
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
    <div className="bg-[#0D0D0D] rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
        <span className="text-[#666] text-xs uppercase tracking-widest">{language}</span>
        <button
          onClick={() => onCopy(code, id)}
          className="text-[#666] hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {copied === id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === id ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-sm overflow-x-auto font-mono leading-relaxed">
        <code className="text-gray-300">{code}</code>
      </pre>
    </div>
  );
}

// MethodBadge component - defined outside to avoid recreation during render
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'text-blue-400 bg-blue-400/10',
    POST: 'text-green-400 bg-green-400/10',
    PUT: 'text-orange-400 bg-orange-400/10',
    DELETE: 'text-red-400 bg-red-400/10',
    PATCH: 'text-purple-400 bg-purple-400/10',
  };
  return (
    <span className={`${colors[method] || 'text-gray-400 bg-gray-400/10'} px-2 py-0.5 rounded text-xs font-mono font-medium shrink-0`}>
      {method}
    </span>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [copied, setCopied] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const apiBaseUrl = 'https://one-backend.stack-end.com';
  const swaggerUrl = `${apiBaseUrl}/docs`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header - Fixed */}
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
                <Link href="/">
                  <span className="text-white">One</span>
                  <span className="text-cyan-400">Router</span>
                </Link>  
                  
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

      {/* Fixed Sidebar - Left */}
      <aside className="hidden lg:block fixed left-0 top-14 bottom-0 w-64 bg-[#050505] border-r border-white/5 overflow-y-auto z-40">
        <div className="p-4">
          <div className="mb-6">
            <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">Getting Started</p>
            {allSections.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeSection === item.id
                    ? 'text-white bg-[#1A1A1A] font-medium'
                    : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">Provider Setup</p>
            {allSections.filter(s => s.category === 'providers').map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeSection === item.id
                    ? 'text-white bg-[#1A1A1A] font-medium'
                    : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">API Reference</p>
            {allSections.slice(7, 14).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeSection === item.id
                    ? 'text-white bg-[#1A1A1A] font-medium'
                    : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">Resources</p>
            {allSections.slice(14).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeSection === item.id
                    ? 'text-white bg-[#1A1A1A] font-medium'
                    : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed lg:hidden top-14 left-0 bottom-0 w-64 bg-[#050005] border-r border-white/5 z-40 overflow-y-auto">
            <div className="p-4">
              <div className="mb-6">
                <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">Getting Started</p>
                {allSections.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                      activeSection === item.id
                        ? 'text-white bg-[#1A1A1A] font-medium'
                        : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">Provider Setup</p>
                {allSections.filter(s => s.category === 'providers').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                      activeSection === item.id
                        ? 'text-white bg-[#1A1A1A] font-medium'
                        : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">API Reference</p>
                {allSections.slice(7, 14).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                      activeSection === item.id
                        ? 'text-white bg-[#1A1A1A] font-medium'
                        : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-2">Resources</p>
                {allSections.slice(14).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                      activeSection === item.id
                        ? 'text-white bg-[#1A1A1A] font-medium'
                        : 'text-[#888] hover:text-white hover:bg-[#0D0D0D]'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content - Scrolls */}
      <main className="lg:pl-64 lg:pr-48 pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {activeSection === 'introduction' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Introduction</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  OneRouter is a unified API gateway for payments, SMS, and email. Connect your provider credentials once and use a single API for all services.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: 'Payments', desc: 'Razorpay, PayPal' },
                  { title: 'SMS', desc: 'Twilio' },
                  { title: 'Email', desc: 'Resend' },
                  { title: 'Test/Live', desc: 'Environment switching' },
                ].map((feature, idx) => (
                  <div key={idx} className="p-4 bg-[#0D0D0D] rounded-lg">
                    <h3 className="text-white font-medium mb-1">{feature.title}</h3>
                    <p className="text-[#666] text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">How it works</h2>
                <ol className="space-y-2 text-[#888]">
                  <li>1. Sign up and get your OneRouter API key</li>
                  <li>2. Connect your provider credentials (Razorpay, PayPal, Twilio, Resend)</li>
                  <li>3. Make API calls to OneRouter - we route to the right provider</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <a href={swaggerUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-white text-black hover:bg-gray-200 text-sm font-medium">
                    API Reference
                  </Button>
                </a>
                <Button variant="ghost" className="text-sm font-medium text-[#888] hover:text-white" onClick={() => setActiveSection('quickstart')}>
                  Quick Start
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'quickstart' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Quick Start</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Get started in 3 steps: get API key, configure providers, make requests.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">1. Get your API key</h2>
                <p className="text-[#888] mb-3">
                  Sign up at <Link href="/dashboard" className="text-white hover:underline">dashboard</Link> and create an API key from the API Keys page.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">2. Configure a provider</h2>
                <p className="text-[#888] mb-3">
                  Go to Services and add your provider credentials (e.g., Razorpay API keys, Twilio credentials).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">3. Make your first request</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="quickstart-payment"
                  language="bash"
                  code={`curl -X POST ${apiBaseUrl}/v1/payments/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "razorpay",
    "amount": 10000,
    "currency": "INR",
    "receipt": "order_123"
  }'`}
                />
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Response</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="quickstart-response"
                  language="json"
                  code={`{
  "success": true,
  "provider": "razorpay",
  "order_id": "order_xxxxxxxxxxxxx",
  "amount": 10000,
  "currency": "INR",
  "status": "created"
}`}
                />
              </div>

              <div className="p-4 bg-[#0D0D0D] rounded-lg">
                <p className="text-[#888] text-sm">
                  <span className="text-white font-medium">Base URL:</span> {apiBaseUrl}
                </p>
              </div>
            </div>
          )}

          {activeSection === 'authentication' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Authentication</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  All API requests require authentication using Bearer tokens.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Authorization header</h2>
                <p className="text-[#888] mb-3">
                  Include your API key in the Authorization header of every request.
                </p>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="auth-header"
                  language="text"
                  code={`Authorization: Bearer sk_test_xxxxx`}
                />
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Rate limits</h2>
                <p className="text-[#888] mb-3">
                  Rate limits are applied per API key.
                </p>
                <div className="bg-[#0D0D0D] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#666] mb-1">Unauthenticated</p>
                      <p className="text-white font-mono">30 requests/minute</p>
                    </div>
                    <div>
                      <p className="text-[#666] mb-1">Authenticated</p>
                      <p className="text-white font-mono">100 requests/minute</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Rate limit headers</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="rate-limit-headers"
                  language="text"
                  code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704067200
Retry-After: 60`}
                />
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Payments</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Create payment orders with Razorpay or PayPal using a unified API.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="text-white">/v1/payments/orders</code>
                </div>
                <p className="text-[#888] mb-3">Create a payment order. Supports Razorpay and PayPal.</p>

                <h3 className="text-white font-medium mb-2">Request Body</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="payments-request"
                  language="json"
                  code={`{
  "provider": "razorpay",  // or "paypal"
  "amount": 10000,         // in smallest currency unit (paise/cents)
  "currency": "INR",       // or "USD" for PayPal
  "receipt": "order_123",  // your order reference
  "notes": {               // optional metadata
    "customer_id": "cust_456"
  }
}`}
                />

                <h3 className="text-white font-medium mb-2 mt-4">Response</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="payments-response"
                  language="json"
                  code={`{
  "success": true,
  "provider": "razorpay",
  "order_id": "order_xxxxxxxxxxxxx",
  "amount": 10000,
  "currency": "INR",
  "status": "created",
  "provider_data": { ... }
}`}
                />
              </div>

              <div className="p-4 bg-[#0D0D0D] rounded-lg">
                <h3 className="text-white font-medium mb-2">Supported Providers</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#888]">Razorpay</p>
                    <p className="text-[#666]">INR payments, UPI, cards, netbanking</p>
                  </div>
                  <div>
                    <p className="text-[#888]">PayPal</p>
                    <p className="text-[#666]">USD/EUR payments, international cards</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payment-links' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Payment Links</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Create shareable payment links that customers can use to pay.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="text-white">/v1/payment-links</code>
                </div>

                <h3 className="text-white font-medium mb-2">Request Body</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="payment-links-request"
                  language="json"
                  code={`{
  "provider": "razorpay",
  "amount": 50000,
  "currency": "INR",
  "description": "Invoice #1234",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "+919876543210"
  },
  "expire_by": 1735689600,    // Unix timestamp (optional)
  "callback_url": "https://yoursite.com/payment-complete"
}`}
                />

                <h3 className="text-white font-medium mb-2 mt-4">Response</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="payment-links-response"
                  language="json"
                  code={`{
  "success": true,
  "provider": "razorpay",
  "payment_link_id": "plink_xxxxxxxxxxxxx",
  "short_url": "https://rzp.io/i/xxxxxx",
  "amount": 50000,
  "status": "created"
}`}
                />
              </div>
            </div>
          )}

          {activeSection === 'subscriptions' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Subscriptions</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Create and manage recurring subscriptions.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { method: 'GET', path: '/v1/subscriptions', desc: 'List all subscriptions' },
                  { method: 'POST', path: '/v1/subscriptions', desc: 'Create subscription' },
                  { method: 'GET', path: '/v1/subscriptions/{id}', desc: 'Get subscription details' },
                  { method: 'POST', path: '/v1/subscriptions/{id}/cancel', desc: 'Cancel subscription' },
                  { method: 'POST', path: '/v1/subscriptions/{id}/pause', desc: 'Pause subscription' },
                  { method: 'POST', path: '/v1/subscriptions/{id}/resume', desc: 'Resume subscription' },
                ].map((endpoint, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-[#0D0D0D] rounded-lg">
                    <MethodBadge method={endpoint.method} />
                    <code className="text-sm text-gray-300 flex-1">{endpoint.path}</code>
                    <span className="text-[#666] text-sm">{endpoint.desc}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-white font-medium mb-2">Create Subscription</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="subscriptions-request"
                  language="json"
                  code={`{
  "provider": "razorpay",
  "plan_id": "plan_xxxxxxxxxxxxx",
  "customer_id": "cust_xxxxxxxxxxxxx",
  "total_count": 12,           // number of billing cycles
  "quantity": 1,
  "start_at": 1735689600       // Unix timestamp (optional)
}`}
                />
              </div>
            </div>
          )}

          {activeSection === 'sms' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">SMS</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Send SMS messages via Twilio.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="text-white">/v1/sms</code>
                </div>

                <h3 className="text-white font-medium mb-2">Request Body</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="sms-request"
                  language="json"
                  code={`{
  "provider": "twilio",
  "to": "+1234567890",
  "message": "Your verification code is 123456"
}`}
                />

                <h3 className="text-white font-medium mb-2 mt-4">Response</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="sms-response"
                  language="json"
                  code={`{
  "success": true,
  "provider": "twilio",
  "message_id": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "to": "+1234567890",
  "status": "queued"
}`}
                />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="text-white">/v1/sms/{'{message_id}'}</code>
                </div>
                <p className="text-[#888]">Get the status of a sent SMS message.</p>
              </div>

              <div className="p-4 bg-[#0D0D0D] rounded-lg">
                <h3 className="text-white font-medium mb-2">Test Mode</h3>
                <p className="text-[#666] text-sm">
                  In test mode, use Twilio magic number <code className="text-[#888]">+15005550006</code> as the from number. No real SMS will be sent.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'email' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Email</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Send transactional emails via Resend.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="text-white">/v1/email</code>
                </div>

                <h3 className="text-white font-medium mb-2">Request Body</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="email-request"
                  language="json"
                  code={`{
  "provider": "resend",
  "to": "user@example.com",
  "subject": "Welcome to our platform",
  "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  "from": "hello@yourdomain.com"
}`}
                />

                <h3 className="text-white font-medium mb-2 mt-4">Response</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="email-response"
                  language="json"
                  code={`{
  "success": true,
  "provider": "resend",
  "email_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "to": "user@example.com",
  "status": "sent"
}`}
                />
              </div>

              <div className="p-4 bg-[#0D0D0D] rounded-lg">
                <h3 className="text-white font-medium mb-2">Test Mode</h3>
                <p className="text-[#666] text-sm">
                  In test mode with unverified domains, emails are only sent to your account email. Use <code className="text-[#888]">onboarding@resend.dev</code> as the from address for testing.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'webhooks' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Webhooks</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Receive real-time notifications for payment events.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Configuration</h2>
                <p className="text-[#888] mb-3">
                  Configure your webhook URL in the dashboard under Settings → Webhooks. OneRouter will forward events from your payment providers.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Webhook Payload</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="webhook-payload"
                  language="json"
                  code={`{
  "event": "payment.captured",
  "provider": "razorpay",
  "timestamp": "2024-01-27T10:00:00Z",
  "data": {
    "order_id": "order_xxxxxxxxxxxxx",
    "payment_id": "pay_xxxxxxxxxxxxx",
    "amount": 10000,
    "currency": "INR",
    "status": "captured"
  }
}`}
                />
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Event Types</h2>
                <div className="space-y-2">
                  {[
                    { event: 'payment.captured', desc: 'Payment successfully captured' },
                    { event: 'payment.failed', desc: 'Payment failed' },
                    { event: 'refund.created', desc: 'Refund initiated' },
                    { event: 'subscription.activated', desc: 'Subscription started' },
                    { event: 'subscription.cancelled', desc: 'Subscription cancelled' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#0D0D0D] rounded-lg">
                      <code className="text-sm text-green-400">{item.event}</code>
                      <span className="text-[#666] text-sm">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'errors' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Errors</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  All errors return consistent JSON responses with status codes and error codes.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Error format</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="error-format"
                  language="json"
                  code={`{
  "error": "error_code",
  "message": "Human readable error message",
  "request_id": "req_xxxxx",
  "timestamp": "2024-01-27T10:00:00Z"
}`}
                />
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Status codes</h2>
                <div className="space-y-2">
                  {[
                    { code: '400', desc: 'Bad Request - Invalid parameters' },
                    { code: '401', desc: 'Unauthorized - Invalid or missing API key' },
                    { code: '404', desc: 'Not Found - Resource does not exist' },
                    { code: '429', desc: 'Too Many Requests - Rate limit exceeded' },
                    { code: '500', desc: 'Server Error - Internal server error' },
                  ].map((error, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#0D0D0D] rounded-lg">
                      <span className="font-mono font-medium text-red-400 text-sm w-12 shrink-0">{error.code}</span>
                      <span className="text-[#888] text-sm">{error.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'razorpay-setup' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Razorpay Setup</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Connect your Razorpay account to accept INR payments via UPI, cards, and net banking.
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <strong>Official Docs:</strong>{' '}
                  <a href="https://razorpay.com/docs/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                    razorpay.com/docs <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">1. Create Razorpay Account</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <a href="https://dashboard.razorpay.com/signup" target="_blank" className="text-white hover:underline">dashboard.razorpay.com/signup</a></li>
                  <li>2. Complete KYC verification (required for live mode)</li>
                  <li>3. Navigate to Settings → API Keys</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">2. Get API Keys</h2>
                <p className="text-[#888] mb-3">Razorpay provides separate keys for test and live environments:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-yellow-400 font-medium mb-2">Test Mode</p>
                    <p className="text-[#666] text-sm">Key ID: <code className="text-[#888]">rzp_test_xxxxx</code></p>
                    <p className="text-[#666] text-sm">No real transactions</p>
                  </div>
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-green-400 font-medium mb-2">Live Mode</p>
                    <p className="text-[#666] text-sm">Key ID: <code className="text-[#888]">rzp_live_xxxxx</code></p>
                    <p className="text-[#666] text-sm">Requires KYC approval</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">3. Add to OneRouter</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <Link href="/razorpay-setup" className="text-white hover:underline">OneRouter Dashboard → Razorpay Setup</Link></li>
                  <li>2. Enter your Key ID and Key Secret</li>
                  <li>3. Select environment (Test or Live)</li>
                  <li>4. Click Save - credentials are encrypted with AES-256</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">4. Test Cards</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="razorpay-test-cards"
                  language="text"
                  code={`Success Card: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits

Failed Card: 4000 0000 0000 0002

UPI Test: success@razorpay (auto-succeeds)`}
                />
              </div>

              <div className="p-4 bg-[#0D0D0D] rounded-lg">
                <h3 className="text-white font-medium mb-2">Webhook Setup (Optional)</h3>
                <p className="text-[#666] text-sm mb-2">
                  To receive payment status updates, configure webhooks in Razorpay Dashboard:
                </p>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="razorpay-webhook"
                  language="text"
                  code={`Webhook URL: ${apiBaseUrl}/v1/credits/webhook/razorpay
Events: payment.captured, payment.failed, refund.created`}
                />
              </div>
            </div>
          )}

          {activeSection === 'paypal-setup' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">PayPal Setup</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Connect PayPal for international USD/EUR payments via cards and PayPal balance.
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <strong>Official Docs:</strong>{' '}
                  <a href="https://developer.paypal.com/docs/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                    developer.paypal.com/docs <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">1. Create PayPal Developer Account</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <a href="https://developer.paypal.com" target="_blank" className="text-white hover:underline">developer.paypal.com</a></li>
                  <li>2. Sign in with your PayPal account (or create one)</li>
                  <li>3. Navigate to Apps & Credentials</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">2. Create an App</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Click &quot;Create App&quot; in the REST API apps section</li>
                  <li>2. Enter app name (e.g., &quot;OneRouter Integration&quot;)</li>
                  <li>3. Select &quot;Merchant&quot; account type</li>
                  <li>4. Copy Client ID and Client Secret</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">3. Get Credentials</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-yellow-400 font-medium mb-2">Sandbox</p>
                    <p className="text-[#666] text-sm">For testing - no real money</p>
                    <p className="text-[#666] text-sm mt-1">API: <code className="text-[#888]">api-m.sandbox.paypal.com</code></p>
                  </div>
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-green-400 font-medium mb-2">Live</p>
                    <p className="text-[#666] text-sm">Real transactions</p>
                    <p className="text-[#666] text-sm mt-1">API: <code className="text-[#888]">api-m.paypal.com</code></p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">4. Add to OneRouter</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <Link href="/paypal-setup" className="text-white hover:underline">OneRouter Dashboard → PayPal Setup</Link></li>
                  <li>2. Enter Client ID and Client Secret</li>
                  <li>3. Select environment (Sandbox or Live)</li>
                  <li>4. Click Save</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">5. Sandbox Test Accounts</h2>
                <p className="text-[#888] text-sm mb-3">
                  PayPal provides sandbox accounts for testing. Find them at Developer Dashboard → Sandbox → Accounts.
                </p>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="paypal-sandbox"
                  language="text"
                  code={`Personal (Buyer): sb-xxxxx@personal.example.com
Business (Seller): sb-xxxxx@business.example.com
Password: Check sandbox accounts page`}
                />
              </div>
            </div>
          )}

          {activeSection === 'twilio-setup' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Twilio Setup</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Connect Twilio to send SMS messages globally.
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <strong>Official Docs:</strong>{' '}
                  <a href="https://www.twilio.com/docs/sms" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                    twilio.com/docs/sms <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">1. Create Twilio Account</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <a href="https://www.twilio.com/try-twilio" target="_blank" className="text-white hover:underline">twilio.com/try-twilio</a></li>
                  <li>2. Sign up and verify your email + phone</li>
                  <li>3. You get $15 free trial credit</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">2. Get Credentials</h2>
                <p className="text-[#888] mb-3">Find these on your Twilio Console dashboard:</p>
                <div className="p-4 bg-[#0D0D0D] rounded-lg space-y-2">
                  <p className="text-[#888] text-sm"><strong className="text-white">Account SID:</strong> ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</p>
                  <p className="text-[#888] text-sm"><strong className="text-white">Auth Token:</strong> Your secret token (click to reveal)</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">3. Get a Phone Number</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to Phone Numbers → Manage → Buy a number</li>
                  <li>2. Select a number with SMS capability</li>
                  <li>3. Or use the trial number (limited to verified numbers)</li>
                </ol>
                <div className="mt-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    <strong>Trial Limitation:</strong> Free trial can only send SMS to verified phone numbers. Add numbers at Console → Verified Caller IDs.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">4. Add to OneRouter</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <Link href="/twilio-setup" className="text-white hover:underline">OneRouter Dashboard → Twilio Setup</Link></li>
                  <li>2. Enter Account SID and Auth Token</li>
                  <li>3. Enter your Twilio phone number (with country code, e.g., +1xxxxx)</li>
                  <li>4. Click Save</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">5. Test Numbers</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="twilio-test"
                  language="text"
                  code={`Magic Numbers (no SMS sent, no charge):
+15005550001 - Invalid number
+15005550006 - Valid test number (use as From)

To test real delivery:
1. Verify your phone at Console → Verified Caller IDs
2. Send to your verified number`}
                />
              </div>
            </div>
          )}

          {activeSection === 'resend-setup' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Resend Setup</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Connect Resend to send transactional emails with high deliverability.
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <strong>Official Docs:</strong>{' '}
                  <a href="https://resend.com/docs" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                    resend.com/docs <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">1. Create Resend Account</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <a href="https://resend.com/signup" target="_blank" className="text-white hover:underline">resend.com/signup</a></li>
                  <li>2. Sign up with email or GitHub</li>
                  <li>3. Free tier includes 3,000 emails/month</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">2. Get API Key</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to API Keys in the Resend dashboard</li>
                  <li>2. Click &quot;Create API Key&quot;</li>
                  <li>3. Name it (e.g., &quot;OneRouter&quot;) and copy the key</li>
                </ol>
                <div className="mt-3 p-4 bg-[#0D0D0D] rounded-lg">
                  <p className="text-[#888] text-sm"><strong className="text-white">API Key format:</strong> re_xxxxxxxxxx</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">3. Verify Domain (Recommended)</h2>
                <p className="text-[#888] text-sm mb-3">
                  Without domain verification, you can only send to your own email address.
                </p>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to Domains → Add Domain</li>
                  <li>2. Add DNS records (DKIM, SPF, DMARC)</li>
                  <li>3. Wait for verification (usually 5-10 minutes)</li>
                </ol>
                <div className="mt-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    <strong>Without verified domain:</strong> Use <code className="text-yellow-300">onboarding@resend.dev</code> as the from address for testing.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">4. Add to OneRouter</h2>
                <ol className="space-y-2 text-[#888] text-sm">
                  <li>1. Go to <Link href="/resend-setup" className="text-white hover:underline">OneRouter Dashboard → Resend Setup</Link></li>
                  <li>2. Enter your API Key</li>
                  <li>3. Enter default &quot;From&quot; email (must be verified domain or onboarding@resend.dev)</li>
                  <li>4. Click Save</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">5. Testing</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="resend-test"
                  language="text"
                  code={`Testing without verified domain:
From: onboarding@resend.dev
To: your-account-email@example.com

Testing with verified domain:
From: hello@yourdomain.com
To: any email address`}
                />
              </div>
            </div>
          )}

          {activeSection === 'troubleshooting' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">Troubleshooting</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Common issues and how to fix them.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Authentication Errors</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">401 Unauthorized</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Check your API key is correct and not expired</li>
                      <li>• Ensure &quot;Bearer&quot; prefix in Authorization header</li>
                      <li>• Verify you&apos;re using the right environment (test vs live)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">Provider credentials not configured</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Add provider credentials in Dashboard → Services</li>
                      <li>• Check the environment matches (test credentials for test mode)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Razorpay Issues</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">Invalid payment signature</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Ensure Key Secret is correct (not Key ID)</li>
                      <li>• Check all callback parameters are passed correctly</li>
                      <li>• Verify signature format matches Razorpay docs</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">Amount mismatch</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Razorpay amounts are in paise (100 paise = ₹1)</li>
                      <li>• ₹100 = 10000 paise</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Twilio Issues</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">21608 - Unverified destination number</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Trial accounts can only send to verified numbers</li>
                      <li>• Add numbers at Console → Verified Caller IDs</li>
                      <li>• Or upgrade to a paid account</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">21211 - Invalid &apos;To&apos; phone number</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Use E.164 format: +[country code][number]</li>
                      <li>• Example: +14155551234 (not 415-555-1234)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Resend Issues</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">Domain not verified</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Without verified domain, use onboarding@resend.dev as from</li>
                      <li>• Without verified domain, can only send to account email</li>
                      <li>• Add DNS records and wait for verification</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">Rate limited</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Free tier: 100 emails/day, 3,000/month</li>
                      <li>• Add delays between emails or upgrade plan</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">PayPal Issues</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-[#0D0D0D] rounded-lg">
                    <p className="text-red-400 font-medium mb-2">INVALID_CLIENT</p>
                    <ul className="text-[#888] text-sm space-y-1">
                      <li>• Check Client ID and Secret are correct</li>
                      <li>• Ensure you&apos;re using sandbox credentials for sandbox mode</li>
                      <li>• Verify the app is created correctly in developer dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1A1A1A] rounded-lg">
                <h3 className="text-white font-medium mb-2">Still stuck?</h3>
                <p className="text-[#888] text-sm">
                  Contact us at <a href="mailto:support@onerouter.com" className="text-white hover:underline">support@onerouter.com</a> with:
                </p>
                <ul className="text-[#666] text-sm mt-2 space-y-1">
                  <li>• Your request_id from the error response</li>
                  <li>• The endpoint you were calling</li>
                  <li>• The full error message</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'sdks' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-3">SDKs</h1>
                <p className="text-[#888] text-lg leading-relaxed">
                  Official SDKs for Python and JavaScript/TypeScript.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Python SDK</h2>
                <p className="text-[#888] text-lg leading-relaxed">
                  Official Python SDK for OneRouter. Supports Python 3.8+ with async/sync interfaces.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Installation</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="python-install"
                  language="bash"
                  code={`pip install onerouter`}
                />
                <p className="text-[#888] text-sm mb-3">With async support:</p>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="python-install-async"
                  language="bash"
                  code={`pip install onerouter[async]`}
                />
              </div>

              <div>
                <h2 className="text-xl font-medium text-white mb-3">Quick start</h2>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="python-example"
                  language="python"
                  code={`from onerouter import OneRouter

client = OneRouter(api_key="sk_test_xxxxx")

# Create payment
payment = client.payments.create(
    provider="razorpay",
    amount=10000,
    currency="INR",
    customer_id="cust_123"
)

# Send SMS
sms = client.sms.send(
    provider="twilio",
    to="+1234567890",
    message="Hello!"
)

# Send Email
email = client.email.send(
    provider="resend",
    to="user@example.com",
    subject="Welcome",
    html="<h1>Welcome!</h1>"
)`}
                />
              </div>

              <div className="p-4 bg-[#0D0D0D] rounded-lg">
                <p className="text-[#888] text-sm">
                  View the full{' '}
                  <a href="https://github.com/onerouter/sdk-python" target="_blank" className="text-white hover:underline">
                    Python SDK on GitHub
                  </a>
                </p>
              </div>

              <hr className="border-white/10 my-8" />

              <div>
                <h2 className="text-xl font-medium text-white mb-3">JavaScript / TypeScript SDK</h2>
                <p className="text-[#888] mb-3">
                  Works with Node.js, React, and Next.js.
                </p>
              </div>

              <div>
                <h3 className="text-white font-medium mb-2">Installation</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="js-install"
                  language="bash"
                  code={`npm install onerouter-js`}
                />
              </div>

              <div>
                <h3 className="text-white font-medium mb-2">Quick start</h3>
                <CodeBlock
                  copied={copied}
                  onCopy={copyToClipboard}
                  id="js-example"
                  language="typescript"
                  code={`import { OneRouter } from 'onerouter-js'

const client = new OneRouter({ apiKey: 'sk_test_xxxxx' })

// Create payment
const payment = await client.payments.create({
  provider: 'razorpay',
  amount: 10000,
  currency: 'INR',
  customer_id: 'cust_123'
})

// Send SMS
const sms = await client.sms.send({
  provider: 'twilio',
  to: '+1234567890',
  message: 'Hello!'
})

// Send Email
const email = await client.email.send({
  provider: 'resend',
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome!</h1>'
})`}
                />
              </div>

              <div className="p-4 bg-[#0D0D0D] rounded-lg">
                <p className="text-[#888] text-sm">
                  View the full{' '}
                  <a href="https://github.com/onerouter/sdk-js" target="_blank" className="text-white hover:underline">
                    JavaScript SDK on GitHub
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed TOC - Right */}
      <aside className="hidden xl:block fixed right-0 top-14 bottom-0 w-48 bg-[#050505] border-l border-white/5 overflow-y-auto z-40">
        <div className="p-4">
          <p className="text-xs font-medium text-[#666] uppercase tracking-widest mb-3">On this page</p>
          <ul className="space-y-1.5">
            {allSections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`text-sm text-left transition-colors ${
                    activeSection === section.id
                      ? 'text-white font-medium'
                      : 'text-[#666] hover:text-gray-400'
                  }`}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
