"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Database, Globe, UserCheck, Clock, Cookie, Github } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

const PolicySection = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="bg-[#1a1a1a] border-[#222] hover:border-cyan-500/50 transition-all duration-300">
    <CardHeader>
      <CardTitle className="flex items-center gap-3 text-xl">
        <Icon className="w-6 h-6 text-cyan-500" />
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-[#888]">{children}</CardContent>
  </Card>
);

export default function PrivacyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
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
              <div className="w-8 h-8 bg-gradient-to-br from-black to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-cyan-500/25 hover:scale-110"></div>
              <Link href="/" className="font-bold text-sm md:text-lg font-mono">
                <span className="text-white">One</span>
                <span className="text-cyan-400">Router</span>
              </Link>
            </div>

            {/* Middle - Navigation Links */}
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-12 border-r border-[#222] px-4 xl:px-8">
              <Link href="/docs" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">docs</Link>
              <Link href="/privacy" className="text-cyan-400 underline decoration-[#00ff88] font-mono text-xs xl:text-sm">privacy</Link>
              <Link href="/terms" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">terms</Link>
              <Link href="/pricing" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">pricing</Link>
              <Link href="/contact" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">contact</Link>
            </nav>

            {/* Right - Auth & GitHub */}
            <div className="flex items-center gap-2 md:gap-4 lg:gap-6 justify-end flex-1 pl-4 md:pl-8">
              <a href="https://github.com/onerouter" className="text-[#888] hover:text-white transition-all duration-300 hover:scale-110">
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
                className="lg:hidden p-2 text-[#888] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu - Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden absolute top-16 left-0 right-0 bg-black border-b border-[#222] px-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Link href="/docs" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">docs</Link>
              <Link href="/privacy" className="block text-cyan-400 font-mono text-sm py-2 border-b border-[#222]">privacy</Link>
              <Link href="/terms" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">terms</Link>
              <Link href="/pricing" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">pricing</Link>
              <Link href="/contact" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">contact</Link>
            </div>
          )}
        </div>
      </header>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_3px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_3px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_70%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-[#888] max-w-2xl mx-auto mb-4">
            Your data security is our top priority.
          </p>
          <p className="text-sm text-[#666]">Last updated: February 2, 2025</p>
        </div>

        {/* Introduction */}
        <div className="mb-12 p-6 bg-[#1a1a1a] border border-[#222] rounded-lg">
          <p className="text-[#888] leading-relaxed">
            OneRouter (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our unified API platform for payments and communications.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          <PolicySection icon={Database} title="Information We Collect">
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Account Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Email address and name (via Clerk authentication)</li>
                  <li>Profile information you voluntarily provide</li>
                  <li>Account preferences and settings</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Payment Gateway Credentials</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>API keys and secrets (encrypted with AES-256-GCM)</li>
                  <li>Provider configuration (Razorpay, PayPal, Stripe)</li>
                  <li>Environment settings (test/live)</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Transaction & Usage Data</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>API request/response logs for debugging</li>
                  <li>Usage analytics and statistics</li>
                  <li>Webhook events from payment providers</li>
                  <li>IP address for security and rate limiting</li>
                </ul>
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Eye} title="How We Use Your Information">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Service Delivery</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Process and route transactions</li>
                  <li>Authenticate API requests</li>
                  <li>Provide usage analytics</li>
                  <li>Send webhook notifications</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Security & Fraud Prevention</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Enforce rate limits</li>
                  <li>Detect suspicious activity</li>
                  <li>Verify webhook signatures</li>
                  <li>Monitor unauthorized access</li>
                </ul>
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Lock} title="Data Security">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-[#0f0f0f] rounded-lg border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">Encryption</h4>
                <ul className="text-sm space-y-1">
                  <li>• Credentials: AES-256-GCM at rest</li>
                  <li>• API Keys: SHA-256 hashing</li>
                  <li>• Transit: HTTPS/TLS 1.3</li>
                  <li>• Database: Encrypted PostgreSQL</li>
                </ul>
              </div>
              <div className="p-4 bg-[#0f0f0f] rounded-lg border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">Access Controls</h4>
                <ul className="text-sm space-y-1">
                  <li>• OAuth 2.0 / JWT authentication</li>
                  <li>• Role-based access control</li>
                  <li>• IP-based rate limiting</li>
                  <li>• Secure session management</li>
                </ul>
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Globe} title="Data Sharing & Third Parties">
            <p className="mb-4">
              We share necessary transaction data with your chosen payment providers (Razorpay, PayPal, Twilio, Resend) to process requests.
            </p>
            <div className="p-4 bg-[#0f0f0f] rounded-lg border border-cyan-500/30">
              <h4 className="text-cyan-400 font-semibold mb-2">What We Don&apos;t Do</h4>
              <ul className="text-sm space-y-1">
                <li>✗ We never sell your personal data</li>
                <li>✗ We don&apos;t share data with advertisers</li>
                <li>✗ We don&apos;t use your credentials for any purpose other than processing your requests</li>
              </ul>
            </div>
          </PolicySection>

          <PolicySection icon={UserCheck} title="Your Rights">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { right: "Access Your Data", desc: "Request a copy of all personal data" },
                { right: "Data Portability", desc: "Export data in machine-readable format" },
                { right: "Delete Your Data", desc: "Request account and data deletion" },
                { right: "Withdraw Consent", desc: "Revoke access at any time" },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-[#0f0f0f] rounded border border-[#333]">
                  <h4 className="text-white font-semibold text-sm">{item.right}</h4>
                  <p className="text-xs text-[#666]">{item.desc}</p>
                </div>
              ))}
            </div>
          </PolicySection>

          <PolicySection icon={Clock} title="Data Retention">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Retention Periods</h4>
                <ul className="text-sm space-y-1">
                  <li>• Transaction Logs: 90 days</li>
                  <li>• Error Logs: 30 days</li>
                  <li>• Account Data: Until deletion</li>
                  <li>• API Keys: Until revocation</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">On Account Deletion</h4>
                <ul className="text-sm space-y-1">
                  <li>• Personal info permanently deleted</li>
                  <li>• API keys revoked immediately</li>
                  <li>• Credentials removed from systems</li>
                  <li>• Some data retained for legal compliance</li>
                </ul>
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Cookie} title="Cookies & Tracking">
            <div className="space-y-3">
              <p>We use cookies to provide and improve our service:</p>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { type: "Essential", desc: "Required for auth & security", required: true },
                  { type: "Session", desc: "Maintain login state", required: true },
                  { type: "Analytics", desc: "Usage understanding", required: false },
                ].map((cookie, idx) => (
                  <div key={idx} className="p-3 bg-[#0f0f0f] rounded border border-[#333]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold text-sm">{cookie.type}</span>
                      {cookie.required && <span className="text-xs text-cyan-400">Required</span>}
                    </div>
                    <p className="text-xs text-[#666]">{cookie.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Shield} title="Regulatory Compliance">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">GDPR (EU)</h4>
                <p className="text-xs">Full compliance including right to rectification, restriction, and objection.</p>
              </div>
              <div className="p-4 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">CCPA (California)</h4>
                <p className="text-xs">Right to know, delete, opt-out. We do not sell your data.</p>
              </div>
              <div className="p-4 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">DPDP (India)</h4>
                <p className="text-xs">Compliance with Digital Personal Data Protection Act 2023.</p>
              </div>
            </div>
          </PolicySection>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Questions About Privacy?</h2>
          <p className="text-[#888] mb-6">Contact our privacy team for any concerns.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:privacy@onerouter.com">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium px-8 py-3">
                privacy@onerouter.com
              </Button>
            </a>
            <Link href="/terms">
              <Button variant="outline" className="border-[#333] text-white hover:border-cyan-500 hover:bg-cyan-500/10 px-8 py-3">
                Terms of Service
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
