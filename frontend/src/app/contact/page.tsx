'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, FileText, Phone, User, Github, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-black text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#222]">
        <div className="w-full h-16 flex items-center border-l border-r border-[#222] relative">
          {/* Vertical gridlines - hidden on mobile */}
          <div className="absolute inset-0 pointer-events-none hidden md:flex">
            <div className="flex-1 border-r border-[#222]"></div>
            <div className="flex-1 border-r border-[#222]"></div>
            <div className="flex-1 border-r border-[#222]"></div>
          </div>

          <div className="w-full h-full flex justify-between items-center px-4 md:px-8 relative z-10">
            {/* Left - Logo */}
            <div className="flex items-center gap-2 border-r border-[#222] pr-4 md:pr-8 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-black to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-cyan-500/25 hover:scale-110"></div>
              <Link href="/" className="font-bold text-sm md:text-lg font-mono cursor-pointer hover:opacity-80 transition">
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
              <Link href="/contact" className="text-cyan-400 underline decoration-[#00ff88] transition-all duration-300 font-mono text-xs xl:text-sm">contact</Link>
            </nav>

            {/* Right - Auth & GitHub */}
            <div className="flex items-center gap-2 md:gap-4 lg:gap-6 justify-end flex-1 pl-4 md:pl-8">
              <a href="https://github.com/" className="text-[#888] hover:text-white transition-all duration-300 hover:scale-110">
                <Github className="w-4 md:w-5 h-4 md:h-5" />
              </a>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="bg-white text-black hover:bg-gray-200 font-mono font-bold text-xs md:text-sm px-3 md:px-6 py-2 rounded transition-all duration-300 transform hover:scale-105">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button className="bg-white text-black hover:bg-gray-200 font-mono font-bold text-xs md:text-sm px-3 md:px-6 py-2 rounded transition-all duration-300 transform hover:scale-105">
                    Dashboard
                  </Button>
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <header className="border-b border-[#222] bg-gradient-to-b from-[#0a0a0a] to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-cyan-400 bg-clip-text text-transparent">
              Get In Touch
            </h1>
            <p className="text-lg md:text-xl text-[#aaa] mb-2">
              We&apos;re here to help with any questions or support you need.
            </p>
            <p className="text-[#777]">
              Multiple ways to reach us for faster response
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Email Support Card */}
          <Card className="group bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <Mail className="w-8 h-8 text-cyan-400 mb-4" />
              <CardTitle className="text-2xl text-cyan-400">Email Support</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div>
                <p className="text-[#888] text-sm mb-2">Primary Email</p>
                <a href="mailto:support@onerouter.com" className="text-white font-mono text-sm hover:text-cyan-400 transition">
                  support@onerouter.com
                </a>
              </div>
              <div>
                <p className="text-[#888] text-sm mb-2">Response Time</p>
                <p className="text-white text-sm">24-48 hours during business days</p>
              </div>
              <div className="pt-4 border-t border-[#222]">
                <a href="mailto:support@onerouter.com" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 transition">
                  Send Email <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Card */}
          <Card className="group bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <FileText className="w-8 h-8 text-cyan-400 mb-4" />
              <CardTitle className="text-2xl text-cyan-400">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div>
                <p className="text-[#888] text-sm mb-2">Self-Service Resources</p>
                <p className="text-white text-sm">Comprehensive guides, API references, and examples</p>
              </div>
              <div>
                <p className="text-[#888] text-sm mb-2">Availability</p>
                <p className="text-white text-sm">24/7 - Available anytime</p>
              </div>
              <div className="pt-4 border-t border-[#222]">
                <Link href="/docs" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 transition">
                  Read Docs <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Phone Support Card */}
          <Card className="group bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <Phone className="w-8 h-8 text-cyan-400 mb-4" />
              <CardTitle className="text-2xl text-cyan-400">Enterprise Support</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div>
                <p className="text-[#888] text-sm mb-2">For Enterprise Plans</p>
                <p className="text-white text-sm">Dedicated support and priority response</p>
              </div>
              <div>
                <p className="text-[#888] text-sm mb-2">Available</p>
                <p className="text-white text-sm">Monday - Friday: 9 AM - 6 PM IST</p>
              </div>
              <div className="pt-4 border-t border-[#222]">
                <Link href="/pricing" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 transition">
                  Enterprise Plans <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Times Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            Response Times by Category
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Technical Support', time: '24-48 hours', icon: '🔧' },
              { title: 'Billing & Payments', time: '1-2 business days', icon: '💳' },
              { title: 'Feature Requests', time: '3-5 business days', icon: '💡' },
              { title: 'Sales & Partnerships', time: '2-3 business days', icon: '🤝' }
            ].map((item, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-cyan-400 font-mono text-sm">{item.time}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            Additional Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Developer Docs',
                description: 'Learn how to integrate OneRouter with your application',
                link: '/docs',
                cta: 'View Docs'
              },
              {
                icon: Github,
                title: 'GitHub Community',
                description: 'Join our developer community and contribute to the project',
                link: 'https://github.com/onerouter',
                cta: 'Visit GitHub',
                external: true
              },
              {
                icon: User,
                title: 'Status Page',
                description: 'Check real-time status and incidents',
                link: 'https://status.onerouter.com',
                cta: 'Check Status',
                external: true
              }
            ].map((resource, idx) => {
              const Icon = resource.icon;
              return (
                <Card key={idx} className="group bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-6 relative z-10">
                    <Icon className="w-8 h-8 text-cyan-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{resource.title}</h3>
                    <p className="text-[#888] text-sm mb-4">{resource.description}</p>
                    <Link 
                      href={resource.link}
                      {...(resource.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 transition"
                    >
                      {resource.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Office Hours Section */}
        <Card className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-black border border-cyan-500/30 mb-12">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Office Hours</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-cyan-400 font-semibold">Monday - Friday</p>
                    <p className="text-[#aaa]">9:00 AM - 6:00 PM IST</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-semibold">Saturday & Sunday</p>
                    <p className="text-[#666]">Closed (Emergency support available)</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Quick Facts</h3>
                <div className="space-y-3 text-[#aaa] text-sm">
                  <p>✓ Fastest response for technical issues</p>
                  <p>✓ Free tier support available</p>
                  <p>✓ Dedicated enterprise support plans</p>
                  <p>✓ Community support 24/7 on GitHub</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-b from-[#0a0a0a] to-transparent rounded-2xl p-12 border border-[#222]">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-[#888] mb-8 max-w-2xl mx-auto">
            Check our documentation for quick answers, or reach out directly to our support team for personalized assistance.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/docs">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
                Explore Documentation
              </Button>
            </Link>
            <a href="mailto:support@onerouter.com">
              <Button variant="outline" className="border-cyan-500/50 text-white hover:border-cyan-400 hover:bg-cyan-500/10 px-8 py-3 rounded-lg transition-all">
                Contact Support
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] mt-16 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-[#888]">
              <Link href="/docs" className="hover:text-white transition">Documentation</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            </div>
            <p className="text-sm text-[#666]">
              © 2025 OneRouter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
