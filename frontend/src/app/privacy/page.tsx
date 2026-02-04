"use client";

import { Button } from "@/components/ui/button";
import { Github, Shield, Lock, Database, Mail } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function PrivacyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
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

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-white mb-3">Privacy Policy</h1>
          <p className="text-[#888]">Last updated: February 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-[#888]">
          <section>
            <h2 className="text-white font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#666]" />
              Overview
            </h2>
            <p className="leading-relaxed">
              OneRouter is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#666]" />
              Information We Collect
            </h2>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>Account information (email via Clerk authentication)</li>
              <li>API keys and provider credentials (encrypted)</li>
              <li>Usage data and analytics</li>
              <li>IP addresses for security and rate limiting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#666]" />
              How We Protect Your Data
            </h2>
            <div className="grid gap-3 mt-3">
              <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <p className="text-white font-medium mb-1">Encryption</p>
                <p className="text-sm">AES-256-GCM encryption at rest, TLS 1.3 in transit</p>
              </div>
              <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <p className="text-white font-medium mb-1">Credentials</p>
                <p className="text-sm">API keys hashed with SHA-256, never stored in plain text</p>
              </div>
              <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <p className="text-white font-medium mb-1">Access Control</p>
                <p className="text-sm">OAuth 2.0, role-based access, secure sessions</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">Data Sharing</h2>
            <p className="leading-relaxed">
              We share transaction data with your chosen providers (Razorpay, PayPal, Twilio, Resend) to process requests. We never sell your personal data or share it with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">Your Rights</h2>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <p className="text-white font-medium mb-1 text-sm">Access</p>
                <p className="text-[#666] text-xs">Request a copy of your data</p>
              </div>
              <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <p className="text-white font-medium mb-1 text-sm">Delete</p>
                <p className="text-[#666] text-xs">Request account deletion</p>
              </div>
              <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <p className="text-white font-medium mb-1 text-sm">Export</p>
                <p className="text-[#666] text-xs">Download your data</p>
              </div>
              <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <p className="text-white font-medium mb-1 text-sm">Rectify</p>
                <p className="text-[#666] text-xs">Correct inaccurate data</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">Data Retention</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-3 bg-[#0D0D0D] rounded-lg border border-white/5">
                <span className="text-[#666]">Transaction logs</span>
                <span className="text-white">90 days</span>
              </div>
              <div className="flex justify-between p-3 bg-[#0D0D0D] rounded-lg border border-white/5">
                <span className="text-[#666]">Error logs</span>
                <span className="text-white">30 days</span>
              </div>
              <div className="flex justify-between p-3 bg-[#0D0D0D] rounded-lg border border-white/5">
                <span className="text-[#666]">Account data</span>
                <span className="text-white">Until deletion</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">Compliance</h2>
            <p className="leading-relaxed mb-3">
              OneRouter complies with GDPR, CCPA, and India&apos;s DPDP Act.
            </p>
            <p className="text-sm">
              We do not sell personal data. We process data only to provide our service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">Contact</h2>
            <p className="leading-relaxed">
              For privacy questions, contact us at{' '}
              <a href="mailto:privacy@onerouter.com" className="text-white hover:underline">
                privacy@onerouter.com
              </a>
            </p>
          </section>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <Link href="/terms">
            <Button variant="ghost" className="text-sm text-[#888] hover:text-white">
              Terms of Service
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" className="text-sm text-[#888] hover:text-white">
              Contact Us
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
