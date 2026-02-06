'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Shield, Globe, Code, ArrowRight,
  Github, Twitter, Linkedin, Building2, Users, Target
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { LazyBentoGrid } from '@/components/lazy';

export default function AboutPage() {
  const features = [
    {
      icon: <Zap className="w-5 h-5 text-cyan-500" />,
      title: 'Unified API',
      description: 'One integration for multiple payment and communication providers.',
    },
    {
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
      title: 'Secure by Default',
      description: 'Enterprise-grade security with encrypted credentials and audit logs.',
    },
    {
      icon: <Globe className="w-5 h-5 text-blue-500" />,
      title: 'Multi-Provider',
      description: 'Razorpay, PayPal, Stripe, Twilio, Resend - all through one API.',
    },
    {
      icon: <Code className="w-5 h-5 text-purple-500" />,
      title: 'Developer First',
      description: 'Clean APIs, comprehensive docs, and SDKs for rapid integration.',
    },
  ];

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Metrics */}
          <LazyBentoGrid items={[
            {
              title: "Mission",
              meta: "Simplify",
              description: "One API for all integrations",
              icon: <Target className="w-4 h-4 text-cyan-500" />,
              status: "Core",
              tags: ["Vision"],
              colSpan: 1,
            },
            {
              title: "Providers",
              meta: "5+",
              description: "Payment & communication services",
              icon: <Globe className="w-4 h-4 text-emerald-500" />,
              status: "Growing",
              tags: ["Integrations"],
              colSpan: 1,
            },
            {
              title: "Focus",
              meta: "Developers",
              description: "Built for engineering teams",
              icon: <Code className="w-4 h-4 text-blue-500" />,
              status: "Priority",
              tags: ["Product"],
              colSpan: 1,
            },
          ]} />

          {/* Hero */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-8">
            <CardContent className="p-8">
              <h1 className="text-3xl font-bold mb-4">
                One API for All Your
                <span className="text-cyan-500"> Payment & Communication</span> Needs
              </h1>
              <p className="text-zinc-400 leading-relaxed">
                OneRouter simplifies integrations by providing a unified API layer for payments,
                subscriptions, and communications across multiple providers. Stop maintaining
                dozens of integrations - use one consistent interface for everything.
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-[#09090b] border-zinc-800/50">
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 border border-zinc-800">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* What We Support */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <Building2 className="w-5 h-5 text-cyan-500" />
                What We Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-3">
                    Payments
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">Live</Badge>
                      Razorpay - Orders, Payments, Refunds
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">Live</Badge>
                      PayPal - Checkout, Subscriptions
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-zinc-500/15 text-zinc-400 text-[10px]">Soon</Badge>
                      Stripe - Coming Soon
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-3">
                    Communications
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">Live</Badge>
                      Twilio - SMS, Voice, WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">Live</Badge>
                      Resend - Transactional Email
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-3">
                    Subscriptions
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">Live</Badge>
                      Razorpay Subscriptions
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-zinc-500/15 text-zinc-400 text-[10px]">Soon</Badge>
                      PayPal Subscriptions
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-3">
                    Marketplace
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">Live</Badge>
                      Razorpay Route - Split Payments
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">Live</Badge>
                      Vendor Management
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <Users className="w-5 h-5 text-cyan-500" />
                Get in Touch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 mb-6">
                Have questions or want to learn more? We&apos;d love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button className="bg-white text-black hover:bg-zinc-200">
                    Contact Us
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" className="bg-transparent border-zinc-700 text-zinc-400 hover:text-black hover:border-zinc-600">
                    View Documentation
                  </Button>
                </Link>
              </div>

              {/* Social Links */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-zinc-800/60">
                <a
                  href="https://github.com/onerouter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/onerouter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/company/onerouter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
}
