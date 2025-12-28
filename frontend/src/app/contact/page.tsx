'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, MapPin, FileText, ExternalLink, Phone, User } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    plan: 'starter'
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '', plan: 'starter' });
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-[#222]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-[#888] mt-2">We&apos;re here to help</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-[#1a1a1a] border-[#222]">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-500">Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-500 mb-2">Message Sent!</h3>
                   <p className="text-[#888]">
                     Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                   </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-[#222] text-white hover:border-cyan-500"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                      className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select a topic...</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="feature">Feature Request</option>
                      <option value="security">Security Concern</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="plan" className="block text-sm font-medium text-white mb-2">
                      Your Plan (Optional)
                    </label>
                    <select
                      id="plan"
                      value={formData.plan}
                      onChange={(e) => handleInputChange('plan', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                      rows={5}
                      className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      placeholder="How can we help you today?"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
                  >
                    Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-500">Get In Touch</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-cyan-500 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Email Support</h3>
                    <p className="text-[#888] text-sm mb-2">privacy@onerouter.com</p>
                    <p className="text-sm text-[#888]">
                      Expect response within 24-48 hours during business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <ExternalLink className="w-6 h-6 text-cyan-500 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Documentation</h3>
                    <p className="text-[#888] text-sm mb-2">
                      Comprehensive guides, API references, and examples.
                    </p>
                    <Link
                      href="/docs"
                      className="text-cyan-500 hover:text-cyan-400 text-sm"
                    >
                      Read the Docs →
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-cyan-500 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Office Hours</h3>
                    <p className="text-sm text-[#888] mb-2">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                    <p className="text-sm text-[#666]">Saturday & Sunday: Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-500">Response Times</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Technical Support</h3>
                    <p className="text-sm text-[#888]">
                      <strong className="text-cyan-500">24-48 hours:</strong> For urgent technical issues
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Billing & Payments</h3>
                    <p className="text-sm text-[#888]">
                      <strong className="text-cyan-500">1-2 business days:</strong> For billing inquiries and payment disputes
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Feature Requests</h3>
                    <p className="text-sm text-[#888]">
                      <strong className="text-cyan-500">3-5 business days:</strong> For product feedback and feature suggestions
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Sales & Partnerships</h3>
                    <p className="text-sm text-[#888]">
                      <strong className="text-cyan-500">2-3 business days:</strong> For partnership and enterprise inquiries
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-500">Additional Resources</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-cyan-500 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Documentation</h3>
                    <p className="text-sm text-[#888] mb-2">
                      Self-service documentation for developers.
                    </p>
                    <Link
                      href="/docs"
                      className="text-cyan-500 hover:text-cyan-400 text-sm"
                    >
                      View Documentation →
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-cyan-500 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Enterprise Support</h3>
                    <p className="text-sm text-[#888] mb-2">
                      Dedicated support for enterprise plans.
                    </p>
                    <Link
                      href="/pricing"
                      className="text-cyan-500 hover:text-cyan-400 text-sm"
                    >
                      View Enterprise Plans →
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-cyan-500 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Community</h3>
                    <p className="text-sm text-[#888] mb-2">
                      Join our developer community for peer support.
                    </p>
                    <Link
                      href="https://github.com/onerouter"
                      target="_blank"
                      className="text-cyan-500 hover:text-cyan-400 text-sm"
                    >
                      Join on GitHub →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-3">Need Quick Help?</h3>
                <p className="text-[#888] mb-6">
                  Check our documentation first for immediate answers to common questions.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Link href="/docs">
                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
                      Browse Docs
                    </Button>
                  </Link>
                  <Link href="https://github.com/onerouter/issues"
                    target="_blank"
                  rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-[#222] text-white hover:border-cyan-500">
                      GitHub Issues
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-[#888]">
              <Link href="/docs">Documentation</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/pricing">Pricing</Link>
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
