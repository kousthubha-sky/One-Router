'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useClientApiCall } from '@/lib/api-client';

interface CreateSubscriptionForm {
  provider: string;
  customer_id: string;
  plan_id: string;
  billing_cycle: string;
}

export default function CreateSubscriptionPage() {
  const [formData, setFormData] = useState<CreateSubscriptionForm>({
    provider: '',
    customer_id: '',
    plan_id: '',
    billing_cycle: 'monthly',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const apiClient = useClientApiCall();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.provider || !formData.customer_id || !formData.plan_id) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient('/v1/subscriptions', {
        method: 'POST',
        body: JSON.stringify(formData),
      }) as { error?: string };

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess('Subscription created successfully!');
        setTimeout(() => {
          window.location.href = '/subscriptions';
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Link href="/subscriptions">
            <Button variant="ghost" className="mb-6 text-white hover:bg-[#1a1a1a]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subscriptions
            </Button>
          </Link>

          <Card className="bg-[#1a1a1a] border-[#222]">
            <CardHeader>
              <CardTitle className="text-2xl">Create New Subscription</CardTitle>
              <p className="text-[#888] mt-2">Set up a new subscription for a customer</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Provider Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select a provider</option>
                    <option value="stripe">Stripe</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                {/* Customer ID */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Customer ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    placeholder="Enter customer ID from the provider"
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-md text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Plan ID */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Plan ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="plan_id"
                    value={formData.plan_id}
                    onChange={handleChange}
                    placeholder="Enter plan ID from the provider"
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-md text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Billing Cycle
                  </label>
                  <select
                    name="billing_cycle"
                    value={formData.billing_cycle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-sm">
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white flex-1"
                  >
                    {loading ? 'Creating...' : 'Create Subscription'}
                  </Button>
                  <Link href="/subscriptions" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-white border-[#333] hover:bg-[#1a1a1a]"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-[#1a1a1a] border-[#222] mt-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Required Information</h3>
              <ul className="text-sm text-[#888] space-y-2">
                <li className="flex gap-2">
                  <span className="text-cyan-500">•</span>
                  <span><strong>Provider:</strong> The payment platform (Stripe, Razorpay, PayPal)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-500">•</span>
                  <span><strong>Customer ID:</strong> The customer identifier from your payment provider</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-500">•</span>
                  <span><strong>Plan ID:</strong> The recurring plan/price ID from your provider</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
}
