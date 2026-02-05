'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, CreditCard, User, Calendar, Loader2,
  CheckCircle, AlertCircle, Info, Zap
} from 'lucide-react';
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

  const providers = [
    { id: 'razorpay', name: 'Razorpay', color: 'bg-blue-500' },
    { id: 'paypal', name: 'PayPal', color: 'bg-[#003087]', disabled: true },
  ];

  const billingCycles = [
    { id: 'monthly', label: 'Monthly', description: 'Billed every month' },
    { id: 'quarterly', label: 'Quarterly', description: 'Billed every 3 months' },
    { id: 'yearly', label: 'Yearly', description: 'Billed once a year' },
  ];

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <main className="max-w-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/subscriptions">
            <Button variant="ghost" size="sm" className="mb-6 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              Back to Subscriptions
            </Button>
          </Link>

          {/* Main Form Card */}
          <Card className="bg-[#09090b] border-zinc-800/50">
            <CardHeader className="pb-4 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create Subscription</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">Set up a new recurring payment</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Provider Selection */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                    Payment Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {providers.map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        disabled={provider.disabled}
                        onClick={() => setFormData({ ...formData, provider: provider.id })}
                        className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          formData.provider === provider.id
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : provider.disabled
                            ? 'bg-zinc-900/30 border-zinc-800/50 opacity-50 cursor-not-allowed'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className={`w-8 h-8 ${provider.color} rounded-md flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">
                            {provider.name.charAt(0)}
                          </span>
                        </div>
                        <span className={`text-sm ${formData.provider === provider.id ? 'text-white' : 'text-zinc-400'}`}>
                          {provider.name}
                        </span>
                        {formData.provider === provider.id && (
                          <CheckCircle className="w-4 h-4 text-cyan-500 absolute right-3" />
                        )}
                        {provider.disabled && (
                          <Badge className="absolute right-2 top-2 bg-zinc-800 text-zinc-500 text-[8px]">
                            Soon
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer ID */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                    Customer ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleChange}
                      placeholder="cust_xxxxxxxxxxxxxxx"
                      className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white font-mono placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    Customer ID from your payment provider
                  </p>
                </div>

                {/* Plan ID */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                    Plan ID
                  </label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="plan_id"
                      value={formData.plan_id}
                      onChange={handleChange}
                      placeholder="plan_xxxxxxxxxxxxxxx"
                      className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white font-mono placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    Subscription plan ID from your provider
                  </p>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                    Billing Cycle
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {billingCycles.map((cycle) => (
                      <button
                        key={cycle.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, billing_cycle: cycle.id })}
                        className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                          formData.billing_cycle === cycle.id
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <Calendar className={`w-4 h-4 mb-1.5 ${
                          formData.billing_cycle === cycle.id ? 'text-cyan-500' : 'text-zinc-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          formData.billing_cycle === cycle.id ? 'text-white' : 'text-zinc-400'
                        }`}>
                          {cycle.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-emerald-400">{success}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Link href="/subscriptions" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 text-sm bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading || !formData.provider}
                    className="flex-1 h-10 text-sm bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Subscription'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-400 mb-2">Required Information</p>
                  <ul className="space-y-1.5">
                    <li className="text-[10px] text-zinc-500 flex items-center gap-2">
                      <span className="w-1 h-1 bg-cyan-500 rounded-full" />
                      <span><strong className="text-zinc-400">Customer ID</strong> - From your Razorpay dashboard</span>
                    </li>
                    <li className="text-[10px] text-zinc-500 flex items-center gap-2">
                      <span className="w-1 h-1 bg-cyan-500 rounded-full" />
                      <span><strong className="text-zinc-400">Plan ID</strong> - Subscription plan created in provider</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
}
