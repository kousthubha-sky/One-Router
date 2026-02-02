"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UserCheck, Shield, CreditCard, AlertTriangle, Scale, Ban, Globe, Github } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

const TermsSection = ({
  icon: Icon,
  title,
  number,
  children,
  warning = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  number: string;
  children: React.ReactNode;
  warning?: boolean;
}) => (
  <Card className={`bg-[#1a1a1a] border-[#222] hover:border-cyan-500/50 transition-all duration-300 ${warning ? "border-red-500/30" : ""}`}>
    <CardHeader>
      <CardTitle className={`flex items-center gap-3 text-xl ${warning ? "text-red-400" : ""}`}>
        <Icon className={`w-6 h-6 ${warning ? "text-red-400" : "text-cyan-500"}`} />
        <span className="text-[#666] text-sm font-normal">{number}</span>
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-[#888]">{children}</CardContent>
  </Card>
);

export default function TermsPage() {
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
              <Link href="/terms" className="text-cyan-400 underline decoration-[#00ff88] font-mono text-xs xl:text-sm">terms</Link>
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
              <Link href="/privacy" className="block text-[#888] hover:text-white transition-colors duration-200 font-mono text-sm py-2 border-b border-[#222]">privacy</Link>
              <Link href="/terms" className="block text-cyan-400 font-mono text-sm py-2 border-b border-[#222]">terms</Link>
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
          <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-[#888] max-w-2xl mx-auto mb-4">
            Clear and transparent service agreements.
          </p>
          <p className="text-sm text-[#666]">Last updated: February 2, 2025</p>
        </div>

        {/* Introduction */}
        <div className="mb-12 p-6 bg-[#1a1a1a] border border-[#222] rounded-lg">
          <p className="text-[#888] leading-relaxed">
            By accessing or using OneRouter (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and OneRouter. Please read them carefully before using our unified API platform for payments and communications.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          <TermsSection icon={UserCheck} title="Eligibility" number="01">
            <p>To use OneRouter, you must:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Be at least 18 years old or the age of majority in your jurisdiction</li>
              <li>Have the legal authority to enter into this agreement</li>
              <li>If using on behalf of an organization, have authority to bind that organization</li>
              <li>Not be prohibited from using the service under applicable law</li>
              <li>Have valid credentials with at least one supported payment/communication provider</li>
            </ul>
            <div className="p-3 bg-[#0f0f0f] rounded border border-cyan-500/30 mt-4">
              <p className="text-sm text-cyan-400">
                <strong>Business Use:</strong> If using for business purposes, you represent that you have all necessary rights and authorizations to integrate payment and communication processing.
              </p>
            </div>
          </TermsSection>

          <TermsSection icon={Shield} title="Account Responsibilities" number="02">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">You Are Responsible For</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Maintaining credential confidentiality</li>
                  <li>Not sharing API keys or secrets</li>
                  <li>Notifying us of unauthorized access</li>
                  <li>Using strong, unique passwords</li>
                  <li>Keeping contact info up to date</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Prohibited Activities</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Illegal or unauthorized purposes</li>
                  <li>Unauthorized system access</li>
                  <li>Service interference</li>
                  <li>Malware introduction</li>
                  <li>Fraud or money laundering</li>
                </ul>
              </div>
            </div>
          </TermsSection>

          <TermsSection icon={FileText} title="Intellectual Property" number="03">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">Our Property</h4>
                <p className="text-sm">OneRouter content, features, and functionality are protected by international IP laws.</p>
              </div>
              <div className="p-4 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">Your License</h4>
                <p className="text-sm">Limited, non-exclusive, non-transferable, revocable license to use our API.</p>
              </div>
              <div className="p-4 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-cyan-400 font-semibold mb-2">Your Content</h4>
                <p className="text-sm">You retain ownership of your data. We only process it to provide services.</p>
              </div>
            </div>
          </TermsSection>

          <TermsSection icon={Globe} title="Service Availability" number="04">
            <p>
              We strive to maintain <strong className="text-cyan-400">99.9% uptime</strong> for our API services. However, we do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any aspect of the service.
            </p>
            <div className="p-3 bg-[#0f0f0f] rounded border border-cyan-500/30 mt-4">
              <p className="text-sm text-cyan-400">
                <strong>Note:</strong> We will provide reasonable advance notice for scheduled maintenance or material service changes.
              </p>
            </div>
          </TermsSection>

          <TermsSection icon={CreditCard} title="Payment Gateway Integration" number="05">
            <p className="mb-4">
              OneRouter provides integration with third-party payment gateways. Your use of these is also subject to their respective terms.
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { title: "Provider Agreements", desc: "You agree to terms of Razorpay, PayPal, Stripe, Twilio, Resend" },
                { title: "Transaction Fees", desc: "Providers may charge fees not controlled by OneRouter" },
                { title: "Compliance", desc: "All transactions must comply with applicable laws" },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-[#0f0f0f] rounded border border-[#333]">
                  <h4 className="text-white font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-[#666]">{item.desc}</p>
                </div>
              ))}
            </div>
          </TermsSection>

          <TermsSection icon={CreditCard} title="Fees and Billing" number="06">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">OneRouter Credits</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Credits pay for API usage</li>
                  <li>Purchases are non-refundable (except where required by law)</li>
                  <li>Unused credits don&apos;t expire while account is active</li>
                  <li>Prices subject to change with 30 days notice</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Free Tier</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>New accounts receive complimentary credits</li>
                  <li>Subject to rate limits</li>
                  <li>May be modified or discontinued</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-[#0f0f0f] rounded border border-cyan-500/30 mt-4">
              <p className="text-sm text-cyan-400">
                <strong>No Hidden Fees:</strong> OneRouter does not charge additional fees on transactions. You pay only provider fees plus OneRouter API usage credits.
              </p>
            </div>
          </TermsSection>

          <TermsSection icon={AlertTriangle} title="Limitation of Liability" number="07" warning>
            <p className="mb-4">
              To the maximum extent permitted by law, OneRouter shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-sm mb-4">
              <li>Failed transactions or delays caused by payment providers</li>
              <li>Inaccurate information or data on our platform</li>
              <li>Actions or policies of third-party providers</li>
            </ul>
            <div className="p-4 bg-red-500/10 rounded border border-red-500/30">
              <p className="text-sm text-red-400">
                <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount you paid to us in the preceding 3 months.
              </p>
            </div>
          </TermsSection>

          <TermsSection icon={Ban} title="Termination" number="08">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">You May Terminate</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Delete your account through dashboard</li>
                  <li>Revoke all API keys</li>
                  <li>Contact support team</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">We May Terminate If</h4>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>You violate these Terms</li>
                  <li>Fraudulent or illegal activities</li>
                  <li>Account inactive for 12+ months</li>
                  <li>Failure to pay applicable fees</li>
                </ul>
              </div>
            </div>
          </TermsSection>

          <TermsSection icon={Scale} title="Governing Law & Dispute Resolution" number="09">
            <p className="mb-4">
              These Terms are governed by applicable laws. For disputes, we encourage contacting our support team first to resolve issues amicably within 3 business days.
            </p>
            <div className="p-3 bg-[#0f0f0f] rounded border border-cyan-500/30">
              <p className="text-sm text-cyan-400">
                <strong>Support Email:</strong> support@onerouter.com
              </p>
            </div>
          </TermsSection>

          <TermsSection icon={Shield} title="Indemnification" number="10">
            <p>
              You agree to indemnify and hold harmless OneRouter from claims arising from your violation of these terms, misuse of API keys, or non-compliance with payment provider agreements.
            </p>
          </TermsSection>

          <TermsSection icon={FileText} title="Miscellaneous" number="11">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-white font-semibold text-sm mb-1">Entire Agreement</h4>
                <p className="text-xs text-[#666]">These terms constitute the entire agreement regarding service use.</p>
              </div>
              <div className="p-3 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-white font-semibold text-sm mb-1">Severability</h4>
                <p className="text-xs text-[#666]">Invalid provisions don&apos;t affect remaining terms.</p>
              </div>
              <div className="p-3 bg-[#0f0f0f] rounded border border-[#333]">
                <h4 className="text-white font-semibold text-sm mb-1">No Partnership</h4>
                <p className="text-xs text-[#666]">No partnership, joint venture, or agency relationship created.</p>
              </div>
            </div>
          </TermsSection>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Have Questions?</h2>
          <p className="text-[#888] mb-6">Contact us for any questions about these Terms.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium px-8 py-3">
                Contact Support
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="outline" className="border-[#333] text-white hover:border-cyan-500 hover:bg-cyan-500/10 px-8 py-3">
                Privacy Policy
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
