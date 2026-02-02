"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Shield, TrendingUp, Star, CreditCard, Github } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";




const PricingCard = ({
  title,
  price,
  description,
  features,
  highlight,
  popular = false,
  buttonLabel = "Get Started",
  buttonHref = "/onboarding",
  priceType = "free"
}: {
  title: string;
  price: string;
  description: string;
  features: { text: string; highlight?: boolean }[];
  highlight?: boolean;
  popular?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
  priceType?: string;
}) => (
  <Card
    className={`relative bg-[#1a1a1a] border-2 transition-all duration-300 ${
      highlight
        ? "border-cyan-500 shadow-lg shadow-cyan-500/20 scale-105"
        : popular
        ? "border-cyan-400 shadow-lg shadow-cyan-400/20"
        : "border-[#222] hover:border-cyan-500/50"
    }`}
  >
    <CardContent className="p-6">
      {popular && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          POPULAR
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
        <p className="text-4xl font-bold text-cyan-500">{price}</p>
        {priceType !== "free" && (
          <p className="text-gray-500 text-sm mt-1">
            {priceType === "per_month" ? "/month" : priceType}
          </p>
        )}
      </div>
      <p className="text-[#888] mb-6">{description}</p>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index: number) => (
          <li key={index} className="flex items-start gap-3">
            <Check
              className={`w-5 h-5 shrink-0 ${
                feature.highlight ? "text-cyan-500" : "text-[#666]"
              }`}
            />
            <span className="text-[#888] text-sm">{feature.text}</span>
          </li>
        ))}
      </ul>
      <Link href={buttonHref}>
        <Button
          className={`w-full ${
            highlight
              ? "bg-cyan-500 hover:bg-cyan-600 text-black"
              : popular
              ? "bg-cyan-400 hover:bg-cyan-500 text-black"
              : "bg-[#1a1a1a] hover:bg-cyan-500 text-white border border-[#333]"
          } font-medium`}
        >
          {buttonLabel}
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const FeatureItem = ({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="p-6 border-b border-[#222] last:border-0">
    <div className="flex items-start gap-4">
      <div className="flex shrink-0">
        <Icon className="w-8 h-8 text-cyan-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-[#888] text-sm">{description}</p>
      </div>
    </div>
  </div>
);

export default function PricingPage() {
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
                <div className="w-8 h-8 bg-gradient-to-br from-black  to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-cyan-500/25 hover:scale-110">
                  </div>
                <div className="font-bold text-sm md:text-lg font-mono">
                  
                  <span className="text-white">One</span>
                  <span className="text-cyan-400">Router</span>
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
{/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_3px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_3px)] bg-[size:40px_40px] pointer-events-none"></div>
          
          {/* Radial Diffusion Overlay - Fades gridlines at edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_70%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-[#888] max-w-2xl mx-auto mb-8">
            Pay only for what you use. No subscriptions required.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Pay-Per-Use Pricing
          </h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            We charge based on actual usage, not per API call.
            Similar to how OpenAI charges per token and Twilio per message.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-500" />
                  <span>Payments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-400 mb-2">1% + ₹0.50</div>
                <p className="text-gray-400 text-sm mb-4">per transaction</p>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>Route to Razorpay or PayPal</li>
                  <li>Unified checkout</li>
                  <li>Automatic failover</li>
                  <li>Real-time analytics</li>
                </ul>
                <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-400">
                  Example: ₹1,000 = ₹10.50 fee
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-green-500">💬</span>
                  <span>SMS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-400 mb-2">₹0.10</div>
                <p className="text-gray-400 text-sm mb-4">per message</p>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>Route through Twilio</li>
                  <li>OTP & transactional</li>
                  <li>Delivery tracking</li>
                  <li>10,000+ numbers</li>
                </ul>
                <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-400">
                  Example: 100 SMS = ₹10.00
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-blue-500">✉️</span>
                  <span>Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-400 mb-2">₹0.001</div>
                <p className="text-gray-400 text-sm mb-4">per email</p>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>Route through Resend</li>
                  <li>Transactional & marketing</li>
                  <li>Open & click tracking</li>
                  <li>Custom domains</li>
                </ul>
                <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-400">
                  Example: 1,000 emails = ₹1.00
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Buy Credits (Optional)</h2>
            <p className="text-gray-400">Purchase credits upfront for discounts.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">Starter</div>
                <div className="text-4xl font-bold text-cyan-500 mb-4">₹1,000</div>
                <div className="text-gray-400 mb-4">₹1,000 credits</div>
                <Link href="/credits?amount=1000">
                  <Button className="w-full bg-[#1a1a1a] hover:bg-cyan-500 text-white border border-[#333]">
                    Buy ₹1,000
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="relative bg-[#1a1a1a] border-2 border-cyan-500">
              <CardContent className="p-6 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
                <div className="text-3xl font-bold text-white mb-2">Pro</div>
                <div className="text-4xl font-bold text-cyan-500 mb-4">₹5,000</div>
                <div className="text-gray-400 mb-4">₹6,000 credits (17% off)</div>
                <Link href="/credits?amount=5000">
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                    Buy ₹5,000
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">Enterprise</div>
                <div className="text-4xl font-bold text-cyan-500 mb-4">₹25,000</div>
                <div className="text-gray-400 mb-4">₹35,000 credits (29% off)</div>
                <Link href="/credits?amount=25000">
                  <Button className="w-full bg-[#1a1a1a] hover:bg-cyan-500 text-white border border-[#333]">
                    Buy ₹25,000
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <PricingCard
            title="Developer"
            price="Free"
            description="For learning and small projects"
            features={[
              { text: "1,000 credits/month" },
              { text: "All providers", highlight: true },
              { text: "Test environment" },
              { text: "Basic analytics", highlight: true },
              { text: "Community support" },
            ]}
            buttonLabel="Start Free"
          />

          <PricingCard
            title="Startup"
            price="$39"
            description="For growing teams"
            features={[
              { text: "100,000 credits/month" },
              { text: "All providers", highlight: true },
              { text: "Test + Live", highlight: true },
              { text: "Advanced analytics", highlight: true },
              { text: "Priority support", highlight: true },
              { text: "Higher rate limits" },
            ]}
            popular={true}
            buttonLabel="Start Trial"
            priceType="per_month"
          />

          <PricingCard
            title="Enterprise"
            price="Custom"
            description="For large organizations"
            features={[
              { text: "Unlimited credits", highlight: true },
              { text: "Dedicated support", highlight: true },
              { text: "Custom integrations", highlight: true },
              { text: "SLA guarantee", highlight: true },
              { text: "Volume discounts" },
            ]}
            buttonLabel="Contact Sales"
          />
        </div>

        <h2 className="text-3xl font-bold mb-8">Platform Features</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <FeatureItem
            icon={Zap}
            title="Unified API"
            description="Single API for Razorpay, PayPal, Twilio, and Resend. Integrate once."
          />
          <FeatureItem
            icon={Shield}
            title="Bank-Grade Security"
            description="AES-256 encryption, webhook verification, and CSRF protection."
          />
          <FeatureItem
            icon={TrendingUp}
            title="Developer Experience"
            description="SDKs for Python & JS, detailed docs, and real-time analytics."
          />
          <FeatureItem
            icon={Star}
            title="Scalable Infrastructure"
            description="99.9%+ uptime, automatic failover, and edge caching."
          />
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">Start with our free tier. No credit card required.</p>
          <Link href="/onboarding">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium px-8 py-3">
              Create Free Account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
