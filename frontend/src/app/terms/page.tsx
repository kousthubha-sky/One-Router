import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-[#222]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-[#888] mt-2">Last Updated: December 28, 2025</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[#888] leading-relaxed mb-4">
              By accessing or using OneRouter (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
            <p className="text-[#888] leading-relaxed">
              These Terms of Service constitute a legally binding agreement between you and OneRouter. Please read them carefully.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888] leading-relaxed">
              By creating an account, using our API, or accessing our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Creating an Account</h3>
                <p className="text-sm text-[#888]">
                  You represent that you are at least 18 years old and have the legal capacity to enter into this agreement. You agree to provide accurate, current, and complete information during the registration process.
                </p>
              </div>
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Modifications to Terms</h3>
                <p className="text-sm text-[#888]">
                  We reserve the right to modify these terms at any time. Continued use of the service after modifications constitutes your acceptance of the new terms. We will notify users of material changes via email or in-app notification.
                </p>
              </div>
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Effective Date</h3>
                <p className="text-sm text-[#888]">
                  These Terms of Service are effective as of December 28, 2025. By using our service on or after this date, you agree to the current version of these terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">2. Account Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Account Security</h3>
              <p className="text-[#888] mb-3">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>Not sharing your API keys or payment gateway credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Using strong, unique passwords</li>
                <li>Keeping your contact information up to date</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Prohibited Activities</h3>
              <p className="text-[#888] mb-3">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Introduce malware, viruses, or harmful code</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Use the service to facilitate fraud or money laundering</li>
                <li>Attempt to reverse engineer or decompile our software</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">API Key Usage</h3>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Use API keys only for authorized business purposes</li>
                <li>Do not share API keys with unauthorized parties</li>
                <li>Implement proper error handling in your applications</li>
                <li>Respect rate limits and usage quotas</li>
                <li>Use test environment keys only for development/testing</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Payment Processing</h3>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Ensure all payments comply with applicable laws and regulations</li>
                <li>Provide accurate transaction information to payment gateways</li>
                <li>Handle refunds and disputes in accordance with payment provider terms</li>
                <li>Do not use test payment gateways for live transactions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">3. Service Availability</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888] leading-relaxed">
              We strive to maintain 99.9% uptime for our API services. However, we do not guarantee uninterrupted access.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Scheduled Maintenance</h3>
                <p className="text-sm text-[#888]">
                  We may perform scheduled maintenance with reasonable advance notice. We will attempt to notify users of significant maintenance windows via email or status page.
                </p>
              </div>

              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Service Changes</h3>
                <p className="text-sm text-[#888]">
                  We reserve the right to modify, suspend, or discontinue any aspect of the service at any time. We will provide notice for material changes that affect your use of the service.
                </p>
              </div>

              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Force Majeure Events</h3>
                <p className="text-sm text-[#888]">
                  We are not liable for service unavailability caused by events beyond our reasonable control, including but not limited to acts of God, war, or natural disasters.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">4. Payment Gateway Integration</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888] leading-relaxed mb-4">
              OneRouter provides integration with third-party payment gateways. Your use of these payment gateways is also subject to their respective terms of service.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Provider Agreements</h3>
                <p className="text-sm text-[#888]">
                  By using payment gateways through OneRouter, you agree to the terms and conditions of each respective payment provider (Razorpay, PayPal, Stripe).
                </p>
              </div>

              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Transaction Fees</h3>
                <p className="text-sm text-[#888]">
                  Payment gateway providers may charge transaction fees. OneRouter does not control or benefit from these fees. Please review each provider&apos;s pricing structure.
                </p>
              </div>

              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Currency Conversion</h3>
                <p className="text-sm text-[#888]">
                  For international transactions, currency conversion fees may apply based on payment provider policies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">5. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Disclaimer
              </h3>
              <p className="text-sm text-[#888]">
                To the maximum extent permitted by applicable law, OneRouter shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Transaction Processing</h3>
                <p className="text-sm text-[#888]">
                  We are not liable for failed transactions, delays, or errors caused by payment gateway providers or financial institutions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Data Accuracy</h3>
                <p className="text-sm text-[#888]">
                  While we strive for accuracy, we do not warrant that the information on our platform is complete, accurate, or error-free.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Third-Party Actions</h3>
                <p className="text-sm text-[#888]">
                  We are not responsible for actions, policies, or practices of third-party payment gateway providers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Maximum Liability</h3>
                <p className="text-sm text-[#888]">
                  Our total liability to you for all claims shall not exceed the amount you paid to us in the three (3) months preceding the claim.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">6. Termination</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Termination by You</h3>
              <p className="text-[#888]">
                You may terminate your account at any time by:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Deleting your account through the dashboard</li>
                <li>Revoking all API keys</li>
                <li>Removing all payment gateway credentials</li>
                <li>Contacting our support team</li>
              </ul>
              <p className="text-sm text-[#888] mt-3">
                Upon termination, your right to use the service will immediately cease. You will not be entitled to any refund of fees paid.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Termination by OneRouter</h3>
              <p className="text-[#888] mb-3">
                We reserve the right to suspend or terminate your access to the service if:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>You violate these Terms of Service</li>
                <li>You engage in fraudulent or illegal activities</li>
                <li>Your account remains inactive for an extended period (12+ months)</li>
                <li>You fail to pay applicable fees when required</li>
                <li>We receive valid legal request to terminate your account</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Effect of Termination</h3>
              <p className="text-sm text-[#888]">
                Upon termination:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>All API keys will be immediately revoked</li>
                <li>Access to your account and data will be terminated</li>
                <li>We may retain certain data as required by law or for legitimate business purposes</li>
                <li>Any provisions that by their nature should survive termination will continue to apply</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">7. Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888] leading-relaxed mb-4">
              We are committed to resolving disputes fairly and efficiently. If you have a concern, please contact us first.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Contact Support First</h3>
                <p className="text-sm text-[#888]">
                  Before escalating disputes or filing complaints, please contact our support team to resolve the issue amicably.
                </p>
              </div>

              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Response Time</h3>
                <p className="text-sm text-[#888]">
                  We will respond to support inquiries within 3 business days. For urgent issues, we will respond within 24 hours.
                </p>
              </div>

              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Legal Recourse</h3>
                <p className="text-sm text-[#888]">
                  If disputes cannot be resolved amicably, you agree to submit to binding arbitration in accordance with applicable laws.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">8. Governing Law & Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888] leading-relaxed">
              These Terms of Service and any dispute or claim arising out of or relating to them shall be governed by and construed in accordance with the laws of the jurisdiction where OneRouter is established.
            </p>

            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Governing Law</h3>
                <p className="text-sm text-[#888]">
                  These terms are governed by the laws of [Jurisdiction to be specified by OneRouter], without regard to conflict of law provisions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Jurisdiction</h3>
                <p className="text-sm text-[#888]">
                  Any legal action or proceeding shall be subject to the exclusive jurisdiction of the courts in [Jurisdiction to be specified].
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">International Use</h3>
                <p className="text-sm text-[#888]">
                  For users outside the governing jurisdiction, these terms shall be governed by applicable international laws and regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">9. Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[#888] leading-relaxed mb-4">
              You agree to indemnify and hold harmless OneRouter, its officers, directors, employees, and agents from any claims arising from your use of the service or violation of these Terms of Service.
            </p>

            <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
              <li>Your misuse of API keys or credentials</li>
              <li>Your violation of these terms or applicable laws</li>
              <li>Any third-party claims arising from your use of payment gateways</li>
              <li>Claims related to your non-compliance with payment provider terms</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">10. Miscellaneous</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Entire Agreement</h3>
              <p className="text-sm text-[#888]">
                These Terms of Service constitute the entire agreement between you and OneRouter regarding your use of the service. They supersede all prior agreements.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Severability</h3>
              <p className="text-sm text-[#888]">
                If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Waiver</h3>
              <p className="text-sm text-[#888]">
                Our failure to enforce any right or provision of these terms shall not constitute a waiver of such right or provision.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">No Partnership</h3>
              <p className="text-sm text-[#888]">
                Nothing in these terms shall be construed as creating a partnership, joint venture, or agency relationship between you and OneRouter.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Assignment</h3>
              <p className="text-sm text-[#888]">
                You may not assign or transfer your rights or obligations under these terms without our prior written consent. We may freely assign these terms to any successor of our business.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[#888] leading-relaxed mb-4">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
              <p className="text-sm">
                <strong className="text-cyan-500">Email:</strong> legal@onerouter.com
              </p>
              <p className="text-sm text-[#888] mt-2">
                We typically respond to legal inquiries within 5 business days.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-4 text-cyan-500 hover:text-cyan-400"
            >
              <Button variant="outline" className="border-[#222] text-white hover:border-cyan-500">
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 mb-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Questions?</h2>
            <p className="text-[#888] mb-6 max-w-2xl mx-auto">
              If you have questions about these Terms of Service, our Privacy Policy, or any aspect of our service, please don&apos;t hesitate to reach out.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/contact">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium px-8">
                  Contact Support
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" className="border-[#222] text-white hover:border-cyan-500">
                  View Documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-[#888]">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/docs">Documentation</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/contact">Contact</Link>
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
