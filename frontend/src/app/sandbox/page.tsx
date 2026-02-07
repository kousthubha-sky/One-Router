'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, CreditCard, MessageSquare, Mail, Copy, Check, ArrowRight, Github } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ServiceTab = 'payments' | 'sms' | 'email';

const DEFAULT_REQUESTS: Record<ServiceTab, { body: string; sdkCode: string }> = {
  payments: {
    body: JSON.stringify({
      amount: 1000,
      currency: "INR",
      provider: "razorpay",
      receipt: "order_demo_001"
    }, null, 2),
    sdkCode: `import { OneRouter } from "onerouter"

const router = new OneRouter({
  apiKey: process.env.ONEROUTER_KEY
})

const payment = await router.payments.create({
  provider: "razorpay",
  amount: 1000,
  currency: "INR"
})`
  },
  sms: {
    body: JSON.stringify({
      to: "+15005550001",
      body: "Hello from OneRouter!",
      provider: "twilio"
    }, null, 2),
    sdkCode: `import { OneRouter } from "onerouter"

const router = new OneRouter({
  apiKey: process.env.ONEROUTER_KEY
})

const sms = await router.sms.send({
  to: "+15005550001",
  body: "Hello from OneRouter!"
})`
  },
  email: {
    body: JSON.stringify({
      to: "user@example.com",
      subject: "Welcome to OneRouter",
      html_body: "<h1>Hello!</h1><p>This is sent via OneRouter.</p>",
      provider: "resend"
    }, null, 2),
    sdkCode: `import { OneRouter } from "onerouter"

const router = new OneRouter({
  apiKey: process.env.ONEROUTER_KEY
})

const email = await router.email.send({
  to: "user@example.com",
  subject: "Welcome to OneRouter",
  html_body: "<h1>Hello!</h1>"
})`
  }
};

const SERVICE_META: Record<ServiceTab, { label: string; icon: typeof CreditCard; endpoint: string; color: string }> = {
  payments: { label: 'Payments', icon: CreditCard, endpoint: 'POST /api/sandbox/payments', color: '#00ff88' },
  sms: { label: 'SMS', icon: MessageSquare, endpoint: 'POST /api/sandbox/sms', color: '#00bbff' },
  email: { label: 'Email', icon: Mail, endpoint: 'POST /api/sandbox/email', color: '#ff88ff' },
};

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState<ServiceTab>('payments');
  const [requestBody, setRequestBody] = useState(DEFAULT_REQUESTS.payments.body);
  const [response, setResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = useCallback((tab: ServiceTab) => {
    setActiveTab(tab);
    setRequestBody(DEFAULT_REQUESTS[tab].body);
    setResponse(null);
    setResponseTime(null);
    setError(null);
  }, []);

  const handleRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const start = performance.now();

    try {
      let parsed;
      try {
        parsed = JSON.parse(requestBody);
      } catch {
        setError('Invalid JSON in request body');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/sandbox/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || `HTTP ${res.status}`);
      } else {
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [requestBody, activeTab]);

  const handleCopy = useCallback(async () => {
    if (response) {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response]);

  const meta = SERVICE_META[activeTab];
  const Icon = meta.icon;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-black border-b border-[#222]">
        <div className="w-full h-16 flex items-center border-l border-r border-[#222] relative">
          <div className="w-full h-full flex justify-between items-center px-4 md:px-8 relative z-10">
            <div className="flex items-center gap-2 border-r border-[#222] pr-4 md:pr-8 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-black to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg"></div>
              <div className="font-bold text-sm md:text-lg font-mono">
                <Link href="/">
                  <span className="text-white">One</span>
                  <span className="text-cyan-400">Router</span>
                </Link>
              </div>
            </div>

            <nav className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-12 border-r border-[#222] px-4 xl:px-8">
              <Link href="/docs" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">docs</Link>
              <Link href="/sandbox" className="text-white font-mono text-xs xl:text-sm underline decoration-[#00ff88]">sandbox</Link>
              <Link href="/pricing" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">pricing</Link>
              <Link href="/contact" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">contact</Link>
            </nav>

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
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#888] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="lg:hidden absolute top-16 left-0 right-0 bg-black border-b border-[#222] px-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Link href="/docs" className="block text-[#888] hover:text-white font-mono text-sm py-2 border-b border-[#222]">docs</Link>
              <Link href="/sandbox" className="block text-white font-mono text-sm py-2 border-b border-[#222]">sandbox</Link>
              <Link href="/pricing" className="block text-[#888] hover:text-white font-mono text-sm py-2 border-b border-[#222]">pricing</Link>
              <Link href="/contact" className="block text-[#888] hover:text-white font-mono text-sm py-2 border-b border-[#222]">contact</Link>
            </div>
          )}
        </div>
      </header>

      {/* Page Header */}
      <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 text-xs sm:text-sm text-[#00ff88] font-mono border border-[#00ff88]/30 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></span>
            <span>Live Sandbox — No sign-up required</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 font-mono">
            Try the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-500">API</span>
          </h1>
          <p className="text-sm sm:text-base text-[#888] font-mono max-w-2xl">
            Make real API calls with mock responses. Edit the request, hit Run, and see how OneRouter works — no account needed.
          </p>
        </div>
      </section>

      {/* Sandbox Playground */}
      <section className="px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Service Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(Object.keys(SERVICE_META) as ServiceTab[]).map((tab) => {
              const TabIcon = SERVICE_META[tab].icon;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#111] border border-[#333] text-[#888] hover:text-white hover:border-[#555]'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {SERVICE_META[tab].label}
                </button>
              );
            })}
          </div>

          {/* Endpoint Badge */}
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-[#00ff88]/10 text-[#00ff88] font-mono text-xs px-3 py-1 rounded border border-[#00ff88]/20">
              {meta.endpoint}
            </span>
            {responseTime !== null && (
              <span className="text-[#888] font-mono text-xs">
                {responseTime}ms
              </span>
            )}
          </div>

          {/* Request / Response Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Request Panel */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
              <div className="bg-[#111] border-b border-[#222] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffd93d]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#6bcf7f]"></div>
                  </div>
                  <span className="text-xs text-[#888] font-mono ml-2">Request Body</span>
                </div>
                <Button
                  onClick={handleRun}
                  disabled={loading}
                  className="bg-[#00ff88] text-black hover:bg-[#00dd77] font-mono font-bold text-xs px-4 py-1.5 rounded flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  {loading ? 'Running...' : 'Run'}
                </Button>
              </div>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full bg-transparent text-[#ccc] font-mono text-sm p-4 min-h-[300px] resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Response Panel */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
              <div className="bg-[#111] border-b border-[#222] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#888] font-mono">Response</span>
                  {response && (
                    <span className="text-[10px] text-[#00ff88] font-mono bg-[#00ff88]/10 px-2 py-0.5 rounded">
                      200 OK
                    </span>
                  )}
                  {error && (
                    <span className="text-[10px] text-[#ff6b6b] font-mono bg-[#ff6b6b]/10 px-2 py-0.5 rounded">
                      Error
                    </span>
                  )}
                </div>
                {response && (
                  <button
                    onClick={handleCopy}
                    className="text-[#888] hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="p-4 min-h-[300px] overflow-auto">
                {!response && !error && !loading && (
                  <div className="flex items-center justify-center h-full min-h-[260px] text-[#555] font-mono text-sm">
                    Click "Run" to see the response
                  </div>
                )}
                {loading && (
                  <div className="flex items-center justify-center h-full min-h-[260px]">
                    <div className="flex items-center gap-3 text-[#888] font-mono text-sm">
                      <div className="w-4 h-4 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin"></div>
                      Calling API...
                    </div>
                  </div>
                )}
                {error && (
                  <pre className="text-[#ff6b6b] font-mono text-sm whitespace-pre-wrap">{error}</pre>
                )}
                {response && (
                  <pre className="text-[#ccc] font-mono text-sm whitespace-pre-wrap leading-relaxed">{response}</pre>
                )}
              </div>
            </div>
          </div>

          {/* SDK Code Snippet */}
          <div className="mt-6 bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
            <div className="bg-[#111] border-b border-[#222] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-[#888] font-mono">Equivalent SDK Code (Node.js)</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#888] font-mono bg-[#222] px-2 py-0.5 rounded">npm install onerouter</span>
              </div>
            </div>
            <pre className="p-4 text-sm font-mono text-[#ccc] overflow-x-auto leading-relaxed">
              {DEFAULT_REQUESTS[activeTab].sdkCode}
            </pre>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center border border-[#222] rounded-2xl p-8 sm:p-12 bg-gradient-to-br from-[#050505] to-[#0a0a0a]">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 font-mono">
              Ready to build for real?
            </h2>
            <p className="text-sm text-[#888] font-mono mb-6">
              Sign up free, connect your providers, and start making live API calls in minutes.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="px-8 py-3 text-sm bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition-all duration-300 transform hover:scale-105 font-mono flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button className="px-8 py-3 text-sm bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition-all duration-300 transform hover:scale-105 font-mono flex items-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </SignedIn>
              <Link href="/docs">
                <Button className="px-8 py-3 text-sm border border-[#333] text-white rounded-lg hover:border-[#666] transition-all duration-300 font-mono">
                  Read the Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 border-t border-[#222]">
        <div className="max-w-6xl mx-auto text-center text-[#666] font-mono text-xs sm:text-sm">
          <p>&copy; 2026 One Router. Built for developers, by developers.</p>
        </div>
      </footer>
    </div>
  );
}
