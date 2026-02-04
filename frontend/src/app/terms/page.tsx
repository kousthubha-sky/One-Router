"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function TermsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
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
          <h1 className="text-3xl font-semibold text-white mb-3">Terms of Service</h1>
          <p className="text-[#888]">Last updated: February 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-[#888]">
          <section>
            <h2 className="text-white font-medium mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using OneRouter, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">2. Description of Service</h2>
            <p className="leading-relaxed">
              OneRouter provides a unified API gateway for payments, SMS, and email services. We route your requests to third-party providers including Razorpay, PayPal, Twilio, and Resend.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">3. Account Responsibilities</h2>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>Maintain the confidentiality of your API keys and credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Ensure your use complies with all applicable laws</li>
              <li>Do not use the service for illegal or fraudulent activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">4. Payment and Billing</h2>
            <p className="leading-relaxed mb-3">
              OneRouter uses a credits-based system. You purchase credits which are deducted based on API usage. Purchased credits do not expire.
            </p>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>Credits are deducted per API request</li>
              <li>1 credit = ₹0.01 (Indian Rupee)</li>
              <li>Free tier: 1,000 credits per month</li>
              <li>Refunds are provided only as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">5. Third-Party Services</h2>
            <p className="leading-relaxed">
              Your use of Razorpay, PayPal, Twilio, and Resend is subject to their respective terms of service and privacy policies. OneRouter is not responsible for the actions of these providers.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">6. Limitation of Liability</h2>
            <p className="leading-relaxed">
              OneRouter is provided &quot;as is&quot; without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">7. Termination</h2>
            <p className="leading-relaxed">
              You may delete your account at any time through the dashboard. We may terminate or suspend access for violations of these terms or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-3">8. Contact</h2>
            <p className="leading-relaxed">
              For questions about these terms, contact us at{' '}
              <a href="mailto:support@onerouter.com" className="text-white hover:underline">
                support@onerouter.com
              </a>
            </p>
          </section>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <Link href="/privacy">
            <Button variant="ghost" className="text-sm text-[#888] hover:text-white">
              Privacy Policy
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
