'use client';

import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousal";
import AutoScroll from "embla-carousel-auto-scroll";
import { BackgroundPlus } from "@/components/ui/background-plus";
import { Shield } from "lucide-react";

const TerminalWindow = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const commands = [
    { text: "$ npm install @onerouter/sdk", delay: 50 },
    { text: "✓ Package installed successfully", delay: 30, color: "text-[#00ff88]" },
    { text: "", delay: 0 },
    { text: "$ onerouter init", delay: 50 },
    { text: "→ Initializing One Router...", delay: 30, color: "text-[#888]" },
    { text: "✓ Connected to 127 services", delay: 30, color: "text-[#00ff88]" },
    { text: "", delay: 0 },
    { text: "$ onerouter call stripe.createPayment", delay: 50 },
    { text: '{"amount": 4999, "currency": "usd"}', delay: 30, color: "text-[#ff3366]" },
    { text: "⚡ Response: 23ms", delay: 30, color: "text-[#00ff88]" },
  ];

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (currentLine >= commands.length) {
      setTimeout(() => {
        setCurrentLine(0);
        setCurrentChar(0);
      }, 3000);
      return;
    }

    const currentCommand = commands[currentLine];
    
    if (currentChar < currentCommand.text.length) {
      const timeout = setTimeout(() => {
        setCurrentChar(currentChar + 1);
      }, currentCommand.delay);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCurrentLine(currentLine + 1);
        setCurrentChar(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentLine, currentChar, commands]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#0a0a0a] border border-[#222] rounded-lg overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-[#222]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="ml-2 text-xs text-[#888] font-mono">onerouter-terminal</span>
      </div>

      <div className="p-6 font-mono text-sm min-h-[400px]">
        {commands.slice(0, currentLine).map((cmd, idx) => (
          <div key={idx} className={cn(cmd.color || "text-white", "mb-1")}>
            {cmd.text}
          </div>
        ))}
        {currentLine < commands.length && (
          <div className={cn(commands[currentLine].color || "text-white")}>
            {commands[currentLine].text.slice(0, currentChar)}
            <span className={cn("inline-block w-2 h-4 ml-1 bg-[#00ff88]", showCursor ? "opacity-100" : "opacity-0")} />
          </div>
        )}
      </div>
    </div>
  );
};

const MatrixPreloader = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-[#00ff88]"
            style={{
              animation: `pulse 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const ServiceStatus = ({ name, status }: { name: string; status: "live" | "beta" | "coming" }) => {
  const colors = {
    live: "bg-[#00ff88] text-black",
    beta: "bg-[#ffbd2e] text-black",
    coming: "bg-[#888] text-white",
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-[#1a1a1a] border border-[#222] rounded-lg hover:border-[#00ff88] transition-colors min-w-[160px]">
      <span className="font-mono text-sm text-white capitalize">{name}</span>
      <Badge className={cn(colors[status], "border-0 text-xs font-bold")}>
        {status}
      </Badge>
    </div>
  );
};

const CodeComparison = () => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-[#0a0a0a] border border-[#ff3366] rounded-lg overflow-hidden">
        <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#ff3366]">
          <span className="text-xs font-mono text-[#ff3366]">❌ Without One Router</span>
        </div>
        <pre className="p-4 text-xs font-mono text-white overflow-x-auto">
{`// Multiple SDK imports
import Stripe from 'stripe';
import { Twilio } from 'twilio';
import AWS from 'aws-sdk';

// Multiple configurations
const stripe = new Stripe(KEY);
const twilio = new Twilio(SID, TOKEN);

// Different API patterns
await stripe.charges.create({...});
await twilio.messages.create({...});`}
        </pre>
      </div>

      <div className="bg-[#0a0a0a] border border-[#00ff88] rounded-lg overflow-hidden">
        <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#00ff88]">
          <span className="text-xs font-mono text-[#00ff88]">✓ With One Router</span>
        </div>
        <pre className="p-4 text-xs font-mono text-white overflow-x-auto">
{`// Single import
import { OneRouter } from '@onerouter/sdk';

// Single configuration
const router = new OneRouter({ apiKey });

// Unified API pattern
await router.call('stripe.createCharge', {...});
await router.call('twilio.sendMessage', {...});`}
        </pre>
      </div>
    </div>
  );
};

const MetricCard = ({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className="bg-[#0a0a0a] border-[#222] hover:border-[#00ff88] transition-colors">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-4xl font-bold font-mono text-[#00ff88]">
            {count}{suffix}
          </div>
          <div className="text-sm text-[#888] mt-2 font-mono">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const services = [
    { name: "stripe", status: "live" as const },
    { name: "razorpay", status: "live" as const },
    { name: "paypal", status: "live" as const },
    { name: "square", status: "live" as const },
    { name: "twilio", status: "beta" as const },
    { name: "sendgrid", status: "beta" as const },
    { name: "aws-s3", status: "beta" as const },
    { name: "openai", status: "beta" as const },
    { name: "slack", status: "coming" as const },
    { name: "github", status: "coming" as const },
    { name: "shopify", status: "coming" as const },
    { name: "firebase", status: "coming" as const },
  ];

  return (
    <>
      <MatrixPreloader show={showPreloader} />
      
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 ">
          <div className="max-w-4xl bg-[#1a1a1a]/50 rounded-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#00ff88]" />
                <span className="font-mono text-lg font-bold">OneRouter</span>
              </div>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="outline" className="bg-transparent border-[#222] text-white hover:border-[#00ff88] font-mono">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button className="bg-[#00ff88] text-black hover:bg-[#00dd77] font-mono font-bold">
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative px-6 py-20 overflow-hidden">
          <BackgroundPlus 
            plusColor="#00ff88" 
            plusSize={40} 
            className="opacity-10"
          />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <Badge className="bg-[#1a1a1a] border border-[#00ff88] text-[#00ff88] hover:bg-[#1a1a1a]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#00ff88] mr-2 animate-pulse" />
                127 Services Connected
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 font-mono">
              <span className="text-white">Your Single API.</span>
              <br />
              <span className="text-[#00ff88]">Their Complexity.</span>
            </h1>

            <p className="text-xl text-[#888] text-center mb-12 max-w-2xl mx-auto font-mono">
              Stop juggling multiple SDKs. One Router connects you to every service through a unified API.
            </p>

            <TerminalWindow />

            <div className="flex gap-4 justify-center mt-12">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="px-6 py-3 bg-[#00ff88] text-black font-mono font-bold rounded-lg hover:bg-[#00dd77] transition-colors">
                    Get Started →
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/onboarding">
                  <Button className="px-6 py-3 bg-[#00ff88] text-black font-mono font-bold rounded-lg hover:bg-[#00dd77] transition-colors">
                    Complete Setup →
                  </Button>
                </Link>
              </SignedIn>
              <Button className="px-6 py-3 bg-transparent border border-[#00ff88] text-[#00ff88] font-mono font-bold rounded-lg hover:bg-[#00ff88] hover:text-black transition-colors">
                View Docs
              </Button>
            </div>
          </div>
        </section>

        {/* Service Matrix */}
        <section className="px-6 py-20 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 font-mono">
              Service <span className="text-[#00ff88]">Matrix</span>
            </h2>
            <p className="text-[#888] text-center mb-12 font-mono">
              Connect to 127+ services with a single integration
            </p>

            <div className="relative">
              <Carousel
                opts={{ loop: true }}
                plugins={[AutoScroll({ playOnInit: true, speed: 1 })]}
              >
                <CarouselContent className="ml-0">
                  {services.map((service) => (
                    <CarouselItem
                      key={service.name}
                      className="flex basis-1/2 justify-center pl-0 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                    >
                      <div className="mx-4 flex shrink-0 items-center justify-center">
                        <ServiceStatus name={service.name} status={service.status} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Code Comparison */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 font-mono">
              The <span className="text-[#ff3366]">Difference</span>
            </h2>
            <p className="text-[#888] text-center mb-12 font-mono">
              See how much simpler your code becomes
            </p>

            <CodeComparison />
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="px-6 py-20 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 font-mono">
              Built for <span className="text-[#00ff88]">Performance</span>
            </h2>
            <p className="text-[#888] text-center mb-12 font-mono">
              Lightning-fast responses, industry-leading uptime
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <MetricCard value={23} label="Avg Response Time" suffix="ms" />
              <MetricCard value={99.99} label="Uptime SLA" suffix="%" />
              <MetricCard value={127} label="Connected Services" suffix="+" />
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 font-mono">
              Get Started in <span className="text-[#00ff88]">3 Steps</span>
            </h2>
            <p className="text-[#888] text-center mb-12 font-mono">
              Integration takes less than 5 minutes
            </p>

            <div className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Install the SDK",
                  code: "npm install @onerouter/sdk",
                },
                {
                  step: "02",
                  title: "Initialize with your API key",
                  code: "const router = new OneRouter({ apiKey: 'your-key' });",
                },
                {
                  step: "03",
                  title: "Make your first call",
                  code: "await router.call('service.method', params);",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#00ff88] text-black font-bold font-mono flex items-center justify-center text-lg">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 font-mono text-white">{item.title}</h3>
                    <pre className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 text-sm font-mono text-[#00ff88] overflow-x-auto">
                      {item.code}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developer Resources */}
        <section className="px-6 py-20 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 font-mono">
              Developer <span className="text-[#00ff88]">Resources</span>
            </h2>
            <p className="text-[#888] text-center mb-12 font-mono">
              Everything you need to build with One Router
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Documentation", desc: "Complete API reference and guides", icon: "📚" },
                { title: "SDKs & Tools", desc: "Official SDKs for all major languages", icon: "🛠️" },
                { title: "Changelog", desc: "Stay updated with latest features", icon: "📝" },
              ].map((resource) => (
                <Card key={resource.title} className="bg-[#0a0a0a] border-[#222] hover:border-[#00ff88] transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="text-4xl mb-2">{resource.icon}</div>
                    <CardTitle className="font-mono text-white">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#888] font-mono text-sm">{resource.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20 border-t border-[#222]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-mono">
              Ready to <span className="text-[#00ff88]">simplify</span>?
            </h2>
            <p className="text-xl text-[#888] mb-8 font-mono">
              Join thousands of developers building with One Router
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="px-8 py-4 bg-[#00ff88] text-black font-mono font-bold text-lg rounded-lg hover:bg-[#00dd77] transition-colors">
                  Start Building →
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="px-8 py-4 bg-[#00ff88] text-black font-mono font-bold text-lg rounded-lg hover:bg-[#00dd77] transition-colors">
                  Go to Dashboard →
                </Button>
              </Link>
            </SignedIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-[#222]">
          <div className="max-w-7xl mx-auto text-center text-[#888] font-mono text-sm">
            <p>© 2025 One Router. Built for developers, by developers.</p>
          </div>
        </footer>
      </div>
    </>
  );
}