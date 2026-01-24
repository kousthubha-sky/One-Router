'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Github } from 'lucide-react';

export default function TermsPage() {
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
              <Link href="/terms" className="text-cyan-400 underline decoration-[#00ff88] transition-all duration-300 font-mono text-xs xl:text-sm">terms</Link>
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
      <header className="border-b border-[#222] bg-gradient-to-b from-[#1a1a1a] to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-cyan-400 bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-[#aaa] mb-2">
              Clear and transparent service agreements.
            </p>
            <p className="text-[#777]">
              Our commitment to fair and balanced terms
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-8">
          {/* Section 1 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-[#888] leading-relaxed">
                By accessing or using OneRouter (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
              <p className="text-[#888] leading-relaxed">
                These Terms of Service constitute a legally binding agreement between you and OneRouter. Please read them carefully before using our payment integration platform.
              </p>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">1. Account Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Account Security</h3>
                <p className="text-[#888] mb-3">You are responsible for:</p>
                <ul className="list-disc list-inside text-[#888] space-y-2 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>Not sharing your API keys or payment gateway credentials</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                  <li>Using strong, unique passwords</li>
                  <li>Keeping your contact information up to date</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Prohibited Activities</h3>
                <p className="text-[#888] mb-3">You agree NOT to:</p>
                <ul className="list-disc list-inside text-[#888] space-y-2 ml-4">
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service or servers</li>
                  <li>Introduce malware, viruses, or harmful code</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Use the service to facilitate fraud or money laundering</li>
                  <li>Attempt to reverse engineer or decompile our software</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">2. Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-[#888] leading-relaxed">
                We strive to maintain 99.9% uptime for our API services. However, we do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
              </p>
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <p className="text-sm text-cyan-500">
                  <strong>Note:</strong> We will provide reasonable advance notice for scheduled maintenance or material service changes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">3. Payment Gateway Integration</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-[#888] leading-relaxed mb-2">
                OneRouter provides integration with third-party payment gateways. Your use of these payment gateways is also subject to their respective terms of service.
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-4">
                <li><strong>Provider Agreements:</strong> You agree to the terms of each payment provider (Razorpay, PayPal, Stripe)</li>
                <li><strong>Transaction Fees:</strong> Payment gateway providers may charge fees not controlled by OneRouter</li>
                <li><strong>Compliance:</strong> All transactions must comply with applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card className="group bg-gradient-to-br from-red-500/10 to-[#0f0f0f] border-red-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                4. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-[#888] leading-relaxed">
                To the maximum extent permitted by applicable law, OneRouter shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-4 text-sm">
                <li>Failed transactions or delays caused by payment gateway providers</li>
                <li>Inaccurate information or data on our platform</li>
                <li>Actions or policies of third-party payment providers</li>
              </ul>
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-red-500">
                <p className="text-sm text-red-400">
                  <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount you paid to us in the preceding 3 months.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">5. Termination</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">You May Terminate At Any Time</h3>
                <ul className="list-disc list-inside text-[#888] space-y-1 ml-4 text-sm">
                  <li>Delete your account through the dashboard</li>
                  <li>Revoke all API keys</li>
                  <li>Contact our support team</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">We May Terminate If</h3>
                <ul className="list-disc list-inside text-[#888] space-y-1 ml-4 text-sm">
                  <li>You violate these Terms of Service</li>
                  <li>You engage in fraudulent or illegal activities</li>
                  <li>Your account remains inactive for 12+ months</li>
                  <li>You fail to pay applicable fees</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">6. Governing Law & Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-[#888] leading-relaxed">
                These Terms of Service are governed by applicable laws. For disputes, we encourage contacting our support team first to resolve issues amicably within 3 business days.
              </p>
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <p className="text-sm text-cyan-500">
                  <strong>Support Email:</strong> support@onerouter.com
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">7. Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-[#888] leading-relaxed">
                You agree to indemnify and hold harmless OneRouter from claims arising from your violation of these terms, misuse of API keys, or non-compliance with payment provider agreements.
              </p>
            </CardContent>
          </Card>

          {/* Section 9 */}
          <Card className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#222] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">8. Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Entire Agreement</h3>
                <p className="text-sm text-[#888]">These terms constitute the entire agreement regarding your use of the service.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Severability</h3>
                <p className="text-sm text-[#888]">If any provision is invalid, remaining provisions continue in full effect.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">No Partnership</h3>
                <p className="text-sm text-[#888]">Nothing here creates a partnership, joint venture, or agency relationship.</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="group bg-linear-to-r from-cyan-500/20 via-blue-500/10 to-[#0f0f0f] border-cyan-500/50 hover:border-cyan-500/80 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-cyan-400">Have Questions?</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-[#888] leading-relaxed">
                If you have questions about these Terms of Service, our Privacy Policy, or any aspect of our service, we&apos;re here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/privacy">
                  <Button variant="outline" className="border-cyan-500/50 text-white hover:border-cyan-400 hover:bg-cyan-500/10 px-8 py-3 rounded-lg transition-all">
                    Privacy Policy
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] mt-16 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-[#888]">
              <Link href="/docs" className="hover:text-white transition">Documentation</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
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
    