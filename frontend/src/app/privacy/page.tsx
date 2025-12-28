import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-[#222]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-[#888] mt-2">Last Updated: December 28, 2025</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Introduction</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888] leading-relaxed">
              OneRouter (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our payment integration platform.
            </p>
            <p className="text-[#888] leading-relaxed">
              By using OneRouter, you agree to the collection and use of information in accordance with this policy. If you do not agree with our practices, please do not use our service.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">1. Account Information</h3>
              <p className="text-[#888]">
                When you create an account with OneRouter, we collect:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Email address and name (via Clerk authentication)</li>
                <li>Profile information you voluntarily provide</li>
                <li>Account preferences and settings</li>
                <li>Authentication tokens and session data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">2. Payment Gateway Credentials</h3>
              <p className="text-[#888] mb-3">
                We store your payment gateway API credentials securely:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>API keys and secrets (encrypted at rest using AES-256)</li>
                <li>Provider-specific configuration data (Razorpay, PayPal, Stripe)</li>
                <li>Environment settings (test/live)</li>
              </ul>
              <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
                <p className="text-sm text-cyan-500">
                  <strong>Security:</strong> Credentials are encrypted using industry-standard AES-256-GCM encryption before storage. We never store them in plain text.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">3. Transaction Data</h3>
              <p className="text-[#888] mb-3">
                We collect and process:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Payment transactions initiated through our platform</li>
                <li>API request/response logs for debugging</li>
                <li>Usage analytics and statistics</li>
                <li>Error logs for troubleshooting</li>
                <li>Webhook events from payment providers</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">4. Device and Usage Information</h3>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>IP address for security and rate limiting</li>
                <li>Browser type and version for compatibility</li>
                <li>Operating system information</li>
                <li>Timestamps and session identifiers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Service Delivery</h3>
              <p className="text-[#888]">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Process and route payment transactions to payment gateways</li>
                <li>Authenticate your API requests</li>
                <li>Provide usage analytics and dashboards</li>
                <li>Send transaction status updates via webhooks</li>
                <li>Manage your payment gateway credentials</li>
                <li>Provide customer support</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Security & Fraud Prevention</h3>
              <p className="text-[#888]">
                Your data is used to:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Enforce rate limits to prevent abuse</li>
                <li>Detect and block suspicious API activity</li>
                <li>Verify webhook signatures for authenticity</li>
                <li>Implement CSRF protection for web requests</li>
                <li>Monitor for unauthorized access attempts</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Analytics & Improvement</h3>
              <p className="text-[#888]">
                We use aggregated data to:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Improve API performance and reliability</li>
                <li>Identify and fix bugs</li>
                <li>Develop new features</li>
                <li>Optimize user experience</li>
                <li>Analyze usage patterns for capacity planning</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Data Sharing & Third Parties</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Payment Gateway Providers</h3>
              <p className="text-[#888]">
                We share necessary transaction data with your chosen payment gateway providers (Razorpay, PayPal, Stripe) to process payments. This includes:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Payment amounts and currency</li>
                <li>Customer information (required by providers)</li>
                <li>Transaction metadata for order tracking</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">What We Don&apos;t Share</h3>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>We never sell your personal data to third parties</li>
                <li>We don&apos;t share your data with advertisers</li>
                <li>We don&apos;t use your payment gateway credentials for any purpose other than processing your requests</li>
                <li>We don&apos;t provide your credentials to anyone, including law enforcement, without proper legal process</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Data Transfers</h3>
              <p className="text-[#888]">
                If we transfer your business or assets to another entity:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>You will be notified in advance</li>
                <li>Your personal data will only be transferred with your consent</li>
                <li>The transferee will be bound by this privacy policy</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Data Security</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Encryption</h3>
              <p className="text-[#888]">
                All sensitive data is protected:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li><strong>Payment Gateway Credentials:</strong> AES-256-GCM encryption at rest</li>
                <li><strong>API Keys:</strong> SHA-256 hashing for storage</li>
                <li><strong>Data in Transit:</strong> HTTPS/TLS 1.3 encryption</li>
                <li><strong>Database:</strong> Encrypted PostgreSQL with access controls</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Access Controls</h3>
              <p className="text-[#888]">
                We implement strict access controls:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Authentication via Clerk (OAuth 2.0 / JWT)</li>
                <li>Role-based access control for admin functions</li>
                <li>API key-based authentication with rate limiting</li>
                <li>Session management with secure tokens</li>
                <li>IP-based rate limiting and monitoring</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Infrastructure Security</h3>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Secure hosting with DDoS protection</li>
                <li>Regular security audits and penetration testing</li>
                <li>Web application firewall (WAF)</li>
                <li>Real-time threat monitoring</li>
                <li>Automatic security updates</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Access & Control</h3>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li><strong>Access Your Data:</strong> You can request a copy of all personal data we have about you</li>
                <li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Delete Your Data:</strong> Request deletion of your account and all associated data</li>
                <li><strong>Opt-Out:</strong> Disable data collection for analytics (may affect some features)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Notification Rights</h3>
              <p className="text-[#888]">
                You will be notified if:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>There is a data breach or security incident</li>
                <li>Your credentials are accessed without authorization</li>
                <li>We change how we handle your data</li>
                <li>We receive legal request to disclose your information</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Consent Withdrawal</h3>
              <p className="text-[#888]">
                You can withdraw your consent at any time by:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Deleting your account</li>
                <li>Revoking API key access</li>
                <li>Removing payment gateway credentials</li>
                <li>Contacting our support team</li>
              </ul>
              <p className="text-[#888] mt-3">
                Note: Withdrawal of consent may result in inability to use some features of our service.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Retention Periods</h3>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li><strong>Transaction Logs:</strong> Retained for 90 days for analytics</li>
                <li><strong>Error Logs:</strong> Retained for 30 days for debugging</li>
                <li><strong>Account Data:</strong> Retained until account deletion</li>
                <li><strong>API Keys:</strong> Retained until revocation or account closure</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Deletion</h3>
              <p className="text-[#888]">
                When you delete your account:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>All personal information is permanently deleted</li>
                <li>API keys are revoked immediately</li>
                <li>Payment gateway credentials are deleted from our systems</li>
                <li>Some data may be retained for legal compliance purposes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Legal Requirements</h3>
              <p className="text-[#888]">
                We may retain data longer than specified if required by:
              </p>
              <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
                <li>Law or legal obligations</li>
                <li>Dispute resolution</li>
                <li>Fraud investigation</li>
                <li>Financial record-keeping requirements</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888]">
              We may update this privacy policy from time to time to reflect changes in our practices, technology, or legal requirements.
            </p>
            <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
              <li><strong>Notification:</strong> We will notify users of material changes via email or in-app notification</li>
              <li><strong>Effective Date:</strong> Changes become effective when posted on this page</li>
              <li><strong>Continued Use:</strong> Continued use of OneRouter after changes constitutes acceptance of the updated policy</li>
            </ul>
            <p className="text-[#888] mt-4">
              We encourage you to review this policy periodically. Your continued use of our service indicates your acceptance of any changes.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#888]">
              OneRouter operates globally and may transfer data to countries outside your country of residence, including for:
            </p>
            <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
              <li>Payment processing with international gateway providers</li>
              <li>Cloud infrastructure hosting (data stored in secure data centers)</li>
              <li>Customer support operations</li>
            </ul>
            <p className="text-[#888] mt-4">
              When we transfer your data internationally, we ensure:
            </p>
            <ul className="list-disc list-inside text-[#888] space-y-2 ml-6">
              <li>Adequate protection of your personal information</li>
              <li>Compliance with applicable data protection laws</li>
              <li>Appropriate safeguards for data security</li>
              <li>Mechanisms for you to exercise your data protection rights</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#222] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-500">Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[#888] mb-4">
              If you have questions or concerns about this privacy policy or our data practices, please contact us:
            </p>
            <div className="p-4 bg-[#0a0a0a] rounded-lg border-l-4 border-cyan-500">
              <p className="text-sm">
                <strong className="text-cyan-500">Email:</strong> privacy@onerouter.com
              </p>
              <p className="text-sm text-[#888]">
                We typically respond to privacy inquiries within 30 days.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-4 text-cyan-500 hover:text-cyan-400"
            >
              Contact Support →
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-[#888]">
              <Link href="/docs">Documentation</Link>
              <Link href="/terms">Terms of Service</Link>
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
