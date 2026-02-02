"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, FileText, MessageSquare, Clock, Github, ArrowRight, Headphones, Building } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

const ContactCard = ({
  icon: Icon,
  title,
  children,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) => (
  <Card className={`bg-[#1a1a1a] border-[#222] hover:border-cyan-500/50 transition-all duration-300 ${highlight ? "border-cyan-500/30" : ""}`}>
    <CardHeader>
      <CardTitle className="flex items-center gap-3 text-xl">
        <Icon className="w-6 h-6 text-cyan-500" />
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-[#888]">{children}</CardContent>
  </Card>
);

export default function ContactPage() {
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
              <Link href="/privacy" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">privacy</Link>
              <Link href="/terms" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">terms</Link>
              <Link href="/pricing" className="text-[#888] hover:text-white transition-all duration-300 font-mono text-xs xl:text-sm hover:underline decoration-[#00ff88]">pricing</Link>
              <Link href="/contact" className="text-cyan-400 underline decoration-[#00ff88] font-mono text-xs xl:text-sm">contact</Link>
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
              <Link href="/privacy" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">privacy</Link>
              <Link href="/terms" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">terms</Link>
              <Link href="/pricing" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">pricing</Link>
              <Link href="/contact" className="block text-cyan-400 font-mono text-sm py-2 border-b border-[#222]">contact</Link>
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
          <h1 className="text-5xl font-bold mb-4">Get In Touch</h1>
          <p className="text-xl text-[#888] max-w-2xl mx-auto">
            We&apos;re here to help with any questions or support you need.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <ContactCard icon={Mail} title="Email Support" highlight>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#666] mb-1">General Support</p>
                <a href="mailto:support@onerouter.com" className="text-cyan-400 hover:text-cyan-300 font-mono text-sm transition">
                  support@onerouter.com
                </a>
              </div>
              <div>
                <p className="text-sm text-[#666] mb-1">Privacy Inquiries</p>
                <a href="mailto:privacy@onerouter.com" className="text-cyan-400 hover:text-cyan-300 font-mono text-sm transition">
                  privacy@onerouter.com
                </a>
              </div>
              <div className="pt-3 border-t border-[#333]">
                <p className="text-sm">Response time: 24-48 hours</p>
              </div>
            </div>
          </ContactCard>

          <ContactCard icon={FileText} title="Documentation">
            <div className="space-y-3">
              <p className="text-sm">
                Comprehensive guides, API references, and integration examples.
              </p>
              <div className="pt-3">
                <Link href="/docs" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 transition">
                  Read Documentation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="pt-3 border-t border-[#333]">
                <p className="text-sm text-[#666]">Available 24/7</p>
              </div>
            </div>
          </ContactCard>

          <ContactCard icon={Github} title="GitHub">
            <div className="space-y-3">
              <p className="text-sm">
                Report issues, request features, and contribute to the project.
              </p>
              <div className="pt-3">
                <a href="https://github.com/onerouter" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 transition">
                  Visit Repository <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="pt-3 border-t border-[#333]">
                <p className="text-sm text-[#666]">Community support</p>
              </div>
            </div>
          </ContactCard>
        </div>

        {/* Response Times */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Response Times by Category</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: "🔧", title: "Technical Support", time: "24-48 hours" },
              { icon: "💳", title: "Billing & Payments", time: "1-2 business days" },
              { icon: "💡", title: "Feature Requests", time: "3-5 business days" },
              { icon: "🤝", title: "Sales & Partnerships", time: "2-3 business days" },
            ].map((item, idx) => (
              <Card key={idx} className="bg-[#1a1a1a] border-[#222] hover:border-cyan-500/50 transition-all duration-300">
                <CardContent className="p-5 text-center">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-2">{item.title}</h3>
                  <p className="text-cyan-400 font-mono text-sm">{item.time}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-[#1a1a1a] border-[#222] hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="p-6 flex items-center gap-4">
                <Headphones className="w-10 h-10 text-cyan-500 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Enterprise Support</h3>
                  <p className="text-sm text-[#666]">Dedicated support and priority response for enterprise plans.</p>
                </div>
                <Link href="/pricing" className="text-cyan-400 hover:text-cyan-300 transition">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#222] hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="p-6 flex items-center gap-4">
                <MessageSquare className="w-10 h-10 text-cyan-500 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">API Status</h3>
                  <p className="text-sm text-[#666]">Check real-time status and scheduled maintenance.</p>
                </div>
                <a href="https://status.onerouter.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition">
                  <ArrowRight className="w-5 h-5" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Office Hours */}
        <Card className="bg-[#1a1a1a] border-[#222] mb-12">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-cyan-500" />
                  <h3 className="text-xl font-bold text-white">Office Hours</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#888]">Monday - Friday</span>
                    <span className="text-white font-mono">9:00 AM - 6:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Saturday & Sunday</span>
                    <span className="text-[#666] font-mono">Closed</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Building className="w-6 h-6 text-cyan-500" />
                  <h3 className="text-xl font-bold text-white">Quick Facts</h3>
                </div>
                <ul className="space-y-2 text-[#888] text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Fastest response for technical issues
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Free tier support available
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Dedicated enterprise support plans
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Community support 24/7 on GitHub
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-[#888] mb-8 max-w-xl mx-auto">
            Check our documentation for quick answers, or reach out directly to our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium px-8 py-3">
                Explore Documentation
              </Button>
            </Link>
            <a href="mailto:support@onerouter.com">
              <Button variant="outline" className="border-[#333] text-white hover:border-cyan-500 hover:bg-cyan-500/10 px-8 py-3">
                Contact Support
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
