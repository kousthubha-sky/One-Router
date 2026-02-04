"use client";

import { Button } from "@/components/ui/button";
import { Check, Zap, Building2, Rocket, Github } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function PricingPage() {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exchange rate for display
  const rate = 85;

  const formatPrice = (inr: number) => {
    if (currency === "USD") {
      return `$${(inr / rate).toFixed(2)}`;
    }
    return `₹${inr}`;
  };

  const formatSmallPrice = (inr: number) => {
    if (currency === "USD") {
      const usd = inr / rate;
      if (usd < 0.01) return `$${usd.toFixed(4)}`;
      return `$${usd.toFixed(3)}`;
    }
    return `₹${inr}`;
  };

  return (
    <div className="min-h-screen bg-[#050005] text-white">
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

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-white mb-3">
            Simple pricing, no surprises
          </h1>
          <p className="text-[#888] text-base md:text-lg max-w-xl mx-auto mb-6">
            Add money to your balance. Use it for any service. That&apos;s it.
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#1A1A1A] rounded-lg border border-white/10">
            <button
              onClick={() => setCurrency("INR")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                currency === "INR"
                  ? "bg-white text-black"
                  : "text-[#888] hover:text-white"
              }`}
            >
              INR ₹
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                currency === "USD"
                  ? "bg-white text-black"
                  : "text-[#888] hover:text-white"
              }`}
            >
              USD $
            </button>
          </div>
        </div>

        {/* How It Works - Simple */}
        <div className="mb-12 p-6 bg-[#0D0D0D] rounded-xl border border-white/5">
          <h2 className="text-lg font-medium text-white mb-4 text-center">How pricing works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-cyan-400 font-bold">1</span>
              </div>
              <p className="text-white font-medium mb-1">Add Balance</p>
              <p className="text-[#666] text-sm">Add {formatPrice(100)} or more to your account</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-cyan-400 font-bold">2</span>
              </div>
              <p className="text-white font-medium mb-1">Use Any Service</p>
              <p className="text-[#666] text-sm">Send SMS, emails, or process payments</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-cyan-400 font-bold">3</span>
              </div>
              <p className="text-white font-medium mb-1">Pay Per Use</p>
              <p className="text-[#666] text-sm">We deduct the service cost from your balance</p>
            </div>
          </div>
        </div>

        {/* Service Pricing - Clear Table */}
        <div className="mb-12">
          <h2 className="text-xl font-medium text-white mb-6 text-center">Service Costs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-[#888] font-medium text-sm">Service</th>
                  <th className="text-left py-3 px-4 text-[#888] font-medium text-sm">Provider</th>
                  <th className="text-right py-3 px-4 text-[#888] font-medium text-sm">Cost</th>
                  <th className="text-right py-3 px-4 text-[#888] font-medium text-sm hidden md:table-cell">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-green-400 text-xs">SMS</span>
                      </div>
                      <span className="text-white font-medium">SMS</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#888]">Twilio</td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-white font-semibold">{formatSmallPrice(0.10)}</span>
                    <span className="text-[#666] text-sm"> / message</span>
                  </td>
                  <td className="py-4 px-4 text-right text-[#666] text-sm hidden md:table-cell">
                    1,000 SMS = {formatPrice(100)}
                  </td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-blue-400 text-xs">@</span>
                      </div>
                      <span className="text-white font-medium">Email</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#888]">Resend</td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-white font-semibold">{formatSmallPrice(0.001)}</span>
                    <span className="text-[#666] text-sm"> / email</span>
                  </td>
                  <td className="py-4 px-4 text-right text-[#666] text-sm hidden md:table-cell">
                    10,000 emails = {formatPrice(10)}
                  </td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-purple-400 text-xs">₹</span>
                      </div>
                      <span className="text-white font-medium">Payments</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#888]">Razorpay / PayPal</td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-white font-semibold">Free</span>
                    <span className="text-[#666] text-sm"> (provider fees apply)</span>
                  </td>
                  <td className="py-4 px-4 text-right text-[#666] text-sm hidden md:table-cell">
                    Only pay provider&apos;s standard fees
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#666] text-xs mt-4 text-center">
            * Provider fees (Razorpay 2%, PayPal 2.9%) are charged separately by them, not by us
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="mb-12">
          <h2 className="text-xl font-medium text-white mb-6 text-center">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Free */}
            <div className="p-6 bg-[#0D0D0D] rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-medium text-white">Free</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-semibold text-white">{formatPrice(0)}</span>
                <span className="text-[#666] text-sm"> / month</span>
              </div>
              <p className="text-[#666] text-sm mb-6">Try everything with free credits</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[#888]">{formatPrice(10)} free balance / month</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[#888]">All providers included</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[#888]">Test environment</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[#888]">Community support</span>
                </li>
              </ul>
              <Link href="/onboarding">
                <Button className="w-full bg-[#1A1A1A] text-white hover:bg-[#252525] border border-white/10">
                  Start Free
                </Button>
              </Link>
            </div>

            {/* Pay as you go */}
            <div className="p-6 bg-[#1A1A1A] rounded-xl border border-cyan-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-medium text-white">Pay As You Go</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-semibold text-white">No minimum</span>
              </div>
              <p className="text-[#666] text-sm mb-6">Add any amount, use when needed</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span className="text-[#888]">Add {formatPrice(100)}+ anytime</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span className="text-[#888]">Balance never expires</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span className="text-[#888]">Live environment access</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span className="text-[#888]">Email support</span>
                </li>
              </ul>
              <Link href="/credits">
                <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-medium">
                  Add Balance
                </Button>
              </Link>
            </div>

            {/* Volume */}
            <div className="p-6 bg-[#0D0D0D] rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-medium text-white">Volume</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-semibold text-white">Custom</span>
              </div>
              <p className="text-[#666] text-sm mb-6">For high-volume usage</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span className="text-[#888]">Volume discounts up to 30%</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span className="text-[#888]">Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span className="text-[#888]">SLA guarantees</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span className="text-[#888]">Priority support</span>
                </li>
              </ul>
              <Link href="/contact">
                <Button className="w-full bg-[#1A1A1A] text-white hover:bg-[#252525] border border-white/10">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Volume Discounts */}
        <div className="mb-12 p-6 bg-[#0D0D0D] rounded-xl border border-white/5">
          <h2 className="text-lg font-medium text-white mb-4 text-center">Volume Discounts</h2>
          <p className="text-[#666] text-sm text-center mb-6">Add more, pay less per unit</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-white font-semibold">{formatPrice(100)}+</p>
              <p className="text-[#666] text-sm">Standard rate</p>
            </div>
            <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-white font-semibold">{formatPrice(1000)}+</p>
              <p className="text-green-400 text-sm">10% off</p>
            </div>
            <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-white font-semibold">{formatPrice(5000)}+</p>
              <p className="text-green-400 text-sm">20% off</p>
            </div>
            <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-white font-semibold">{formatPrice(10000)}+</p>
              <p className="text-green-400 text-sm">30% off</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl font-medium text-white mb-6 text-center">Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              {
                q: "Do I need to pay upfront?",
                a: "No. Start with the free tier (₹10 balance/month). Only add money when you need more.",
              },
              {
                q: "Does my balance expire?",
                a: "Purchased balance never expires. Only the free monthly credits reset each month.",
              },
              {
                q: "What payment methods do you accept?",
                a: "UPI, cards, net banking (via Razorpay) for INR. PayPal and Dodo for international cards (USD).",
              },
              {
                q: "Can I get a refund?",
                a: "Unused balance can be refunded within 30 days. Contact support@onerouter.com.",
              },
              {
                q: "Do you charge extra fees on top of providers?",
                a: "For SMS and email, we charge a small markup. For payments, we pass through the provider fees with no markup.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-[#666] text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-[#1A1A1A] rounded-2xl border border-white/5">
            <div className="text-left">
              <p className="text-white font-medium">Ready to start?</p>
              <p className="text-[#666] text-sm">Get {formatPrice(10)} free balance every month</p>
            </div>
            <Link href="/onboarding">
              <Button className="bg-white text-black hover:bg-gray-200 font-medium px-6">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#666] text-sm">© 2025 OneRouter. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-[#666] hover:text-white text-sm">Terms</Link>
              <Link href="/privacy" className="text-[#666] hover:text-white text-sm">Privacy</Link>
              <Link href="/contact" className="text-[#666] hover:text-white text-sm">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
