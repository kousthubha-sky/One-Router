"use client";

import { Button } from "@/components/ui/button";
import { Github, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function ContactPage() {
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
          <h1 className="text-3xl font-semibold text-white mb-3">Get in touch</h1>
          <p className="text-[#888]">
            Have questions? We&apos;re here to help.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid gap-4 mb-12">
          {/* Email Support */}
          <a
            href="mailto:support@onerouter.com"
            className="flex items-center gap-4 p-5 bg-[#0D0D0D] rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
          >
            <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center group-hover:bg-[#252525] transition-colors">
              <Mail className="w-5 h-5 text-[#666] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">Email support</h3>
              <p className="text-[#666] text-sm">support@onerouter.com</p>
            </div>
            <div className="text-xs text-[#666]">24-48 hours</div>
          </a>

          {/* Documentation */}
          <Link
            href="/docs"
            className="flex items-center gap-4 p-5 bg-[#0D0D0D] rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
          >
            <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center group-hover:bg-[#252525] transition-colors">
              <MessageSquare className="w-5 h-5 text-[#666] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">Documentation</h3>
              <p className="text-[#666] text-sm">Browse guides and API reference</p>
            </div>
            <div className="text-xs text-[#666]">Always available</div>
          </Link>

          {/* GitHub */}
          <a
            href="https://github.com/onerouter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-[#0D0D0D] rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
          >
            <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center group-hover:bg-[#252525] transition-colors">
              <Github className="w-5 h-5 text-[#666] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">GitHub</h3>
              <p className="text-[#666] text-sm">Report issues and contribute</p>
            </div>
            <div className="text-xs text-[#666]">Community</div>
          </a>
        </div>

        {/* Response Times */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-white mb-4">Response times</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
              <p className="text-[#666] text-sm mb-1">Technical support</p>
              <p className="text-white font-medium">24-48 hours</p>
            </div>
            <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
              <p className="text-[#666] text-sm mb-1">Billing questions</p>
              <p className="text-white font-medium">1-2 business days</p>
            </div>
            <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
              <p className="text-[#666] text-sm mb-1">Feature requests</p>
              <p className="text-white font-medium">3-5 business days</p>
            </div>
            <div className="p-4 bg-[#0D0D0D] rounded-lg border border-white/5">
              <p className="text-[#666] text-sm mb-1">General inquiries</p>
              <p className="text-white font-medium">2-3 business days</p>
            </div>
          </div>
        </div>

        {/* Office Hours */}
        <div className="p-5 bg-[#0D0D0D] rounded-xl border border-white/5">
          <h2 className="text-lg font-medium text-white mb-4">Office hours</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#666]">Monday - Friday</span>
              <span className="text-white">9:00 AM - 6:00 PM IST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">Saturday - Sunday</span>
              <span className="text-[#666]">Closed</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
