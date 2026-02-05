'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, ChevronDown, ChevronRight, ExternalLink,
  Loader2, Package, Users, CreditCard, Pause, Play, X, Lock, Plus
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { useClientApiCall } from '@/lib/api-client';
import { useSubscriptionAPI } from '@/lib/api-subscriptions';
import { Pagination } from '@/components/ui/pagination';

interface Service {
  id: string;
  service_name: string;
  environment: string;
}

interface Plan {
  id: string;
  entity: string;
  interval: number;
  period: string;
  item: {
    id: string;
    name: string;
    amount: number;
    currency: string;
  };
  notes: Record<string, string>;
  created_at: number;
  provider?: string;
  environment?: string;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  customer_email?: string | null;
  customer_contact?: string | null;
  current_start?: number;
  current_end?: number;
  paid_count?: number;
  total_count?: number;
  short_url?: string;
  created_at: number;
  provider?: string;
  environment?: string;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'razorpay' | 'paypal'>('razorpay');
  const [envMode, setEnvMode] = useState<'test' | 'live' | 'mixed'>('mixed');
  const [plansPage, setPlansPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Load environment mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onerouter_environment_mode');
    if (saved === 'test' || saved === 'live') {
      setEnvMode(saved);
    } else {
      setEnvMode('mixed');
    }
  }, []);

  // Handle environment switch from GlobalEnvironmentToggle
  const handleEnvSwitch = (newEnv: 'test' | 'live') => {
    setEnvMode(newEnv);
  };

  const apiClient = useClientApiCall();
  const subscriptionAPI = useSubscriptionAPI();

  const loadServices = useCallback(async () => {
    try {
      const response = await apiClient('/api/services');
      setServices((response as { services: Service[] }).services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, [apiClient]);

  const loadPlans = useCallback(async () => {
    try {
      const response = await apiClient('/v1/plans');
      setPlans((response as { plans: Plan[] }).plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  }, [apiClient]);

  const loadSubscriptions = useCallback(async () => {
    try {
      const response = await apiClient('/v1/subscriptions');
      setSubscriptions((response as { subscriptions: Subscription[] }).subscriptions || []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  }, [apiClient]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadServices(), loadPlans(), loadSubscriptions()])
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };
    return `${symbols[currency] || currency} ${(amount / 100).toFixed(0)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-500/15 text-emerald-400';
      case 'paused': return 'bg-yellow-500/15 text-yellow-400';
      case 'cancelled': case 'canceled': return 'bg-red-500/15 text-red-400';
      case 'created': return 'bg-blue-500/15 text-blue-400';
      default: return 'bg-zinc-500/15 text-zinc-400';
    }
  };

  const handlePause = async (subId: string) => {
    setActionLoading(subId);
    try {
      await subscriptionAPI.pauseSubscription(subId);
      await loadSubscriptions();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleResume = async (subId: string) => {
    setActionLoading(subId);
    try {
      await subscriptionAPI.resumeSubscription(subId);
      await loadSubscriptions();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (subId: string) => {
    if (!confirm('Cancel this subscription?')) return;
    setActionLoading(subId);
    try {
      await subscriptionAPI.cancelSubscription(subId, true);
      await loadSubscriptions();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  // Filter plans and subscriptions based on environment mode
  const filteredPlans = envMode === 'mixed'
    ? plans
    : plans.filter(p => (p.environment || 'live') === envMode);

  const filteredSubscriptions = envMode === 'mixed'
    ? subscriptions
    : subscriptions.filter(s => (s.environment || 'live') === envMode);

  const activeCount = filteredSubscriptions.filter(s => s.status === 'active').length;
  const createdCount = filteredSubscriptions.filter(s => s.status === 'created').length;

  // Pagination calculations
  const plansTotalPages = Math.ceil(filteredPlans.length / ITEMS_PER_PAGE);
  const subsTotalPages = Math.ceil(filteredSubscriptions.length / ITEMS_PER_PAGE);

  const paginatedPlans = filteredPlans.slice(
    (plansPage - 1) * ITEMS_PER_PAGE,
    plansPage * ITEMS_PER_PAGE
  );

  const paginatedSubscriptions = filteredSubscriptions.slice(
    (subsPage - 1) * ITEMS_PER_PAGE,
    subsPage * ITEMS_PER_PAGE
  );

  // Reset pages when filter changes
  useEffect(() => {
    setPlansPage(1);
    setSubsPage(1);
  }, [envMode]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <header className="border-[#333] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-white/10">
            <div className="flex justify-between items-center py-6">
              <GlobalEnvironmentToggle services={services} apiClient={apiClient} onGlobalSwitch={handleEnvSwitch} />
              <Link href="/subscriptions/create">
                <Button className="bg-white text-black hover:bg-zinc-200 text-sm h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Subscription
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Metrics */}
          <BentoGrid items={[
            {
              title: "Plans Created",
              meta: `${filteredPlans.length}`,
              description: envMode === 'mixed' ? "All environments" : `${envMode} environment`,
              icon: <Package className="w-4 h-4 text-cyan-500" />,
              status: filteredPlans.length > 0 ? "Active" : "None",
              tags: [envMode === 'mixed' ? "All" : envMode],
              colSpan: 1,
            },
            {
              title: "Active Subscriptions",
              meta: `${activeCount}`,
              description: "Currently paying customers",
              icon: <Users className="w-4 h-4 text-emerald-500" />,
              status: activeCount > 0 ? "Active" : "None",
              tags: ["Customers"],
              colSpan: 1,
            },
            {
              title: "Pending",
              meta: `${createdCount}`,
              description: "Awaiting first payment",
              icon: <CreditCard className="w-4 h-4 text-blue-500" />,
              status: createdCount > 0 ? "Pending" : "None",
              tags: ["Pending"],
              colSpan: 1,
            },
          ]} />

          {/* Provider Switcher */}
          <div className="flex items-center gap-2 mt-8 mb-4">
            <span className="text-xs text-zinc-500 mr-2">Provider:</span>

            {/* Razorpay - Active */}
            <button
              onClick={() => setSelectedProvider('razorpay')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                selectedProvider === 'razorpay'
                  ? 'bg-[#0066FF]/10 border-[#0066FF]/30 ring-1 ring-[#0066FF]/20'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12.5 3L20 7.5V16.5L12.5 21L5 16.5V7.5L12.5 3Z" fill="#0066FF"/>
                <path d="M12.5 8L16 10V14L12.5 16L9 14V10L12.5 8Z" fill="white"/>
              </svg>
              <span className={`text-sm font-medium ${
                selectedProvider === 'razorpay' ? 'text-white' : 'text-zinc-400'
              }`}>
                Razorpay
              </span>
              {selectedProvider === 'razorpay' && (
                <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px] ml-1">
                  Active
                </Badge>
              )}
            </button>

            {/* PayPal - Coming Soon */}
            <div className="relative group">
              <button
                disabled
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-zinc-900/30 border-zinc-800/50 cursor-not-allowed opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7.5 21L9 12H6L10.5 3H16.5C18.5 3 20 4.5 19.5 6.5L18.5 10.5C18 12.5 16 14 14 14H11L9.5 21H7.5Z" fill="#003087"/>
                  <path d="M10.5 18L12 9H9L13.5 0H19.5C21.5 0 23 1.5 22.5 3.5L21.5 7.5C21 9.5 19 11 17 11H14L12.5 18H10.5Z" fill="#009CDE" transform="translate(-1, 3)"/>
                </svg>
                <span className="text-sm font-medium text-zinc-500">
                  PayPal
                </span>
                <Lock className="w-3 h-3 text-zinc-600" />
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                PayPal subscriptions coming soon
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
              </div>
            </div>
          </div>

          {/* Plans Section */}
          <Card className="bg-[#09090b] border-zinc-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <Package className="w-5 h-5 text-cyan-500" />
                Subscription Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPlans.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">
                  {envMode === 'mixed'
                    ? "No plans created yet. Create plans in your Razorpay dashboard."
                    : `No ${envMode} plans found. Switch to ${envMode === 'test' ? 'live' : 'test'} or mixed mode to see other plans.`
                  }
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left text-xs text-zinc-500 font-medium py-3 px-4">Plan</th>
                        <th className="text-left text-xs text-zinc-500 font-medium py-3 px-4">Price</th>
                        <th className="text-left text-xs text-zinc-500 font-medium py-3 px-4">Billing</th>
                        <th className="text-left text-xs text-zinc-500 font-medium py-3 px-4">Environment</th>
                        <th className="text-left text-xs text-zinc-500 font-medium py-3 px-4">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPlans.map((plan) => (
                        <tr key={plan.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm text-white font-medium">{plan.item?.name || 'Unnamed'}</p>
                              <code className="text-[10px] text-zinc-600">{plan.id}</code>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-white">
                              {plan.item ? formatAmount(plan.item.amount, plan.item.currency) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-zinc-400">
                              Every {plan.interval} {plan.period}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                              {plan.environment || 'live'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-zinc-500">{formatDate(plan.created_at)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={plansPage}
                    totalPages={plansTotalPages}
                    totalItems={filteredPlans.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setPlansPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Subscriptions Section */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <Users className="w-5 h-5 text-cyan-500" />
                Customer Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">
                  {envMode === 'mixed'
                    ? "No customer subscriptions yet."
                    : `No ${envMode} subscriptions found. Switch to ${envMode === 'test' ? 'live' : 'test'} or mixed mode to see others.`
                  }
                </p>
              ) : (
                <div className="space-y-1">
                  {paginatedSubscriptions.map((sub) => {
                    const isExpanded = expandedSub === sub.id;
                    const isActive = sub.status === 'active';
                    const isPaused = sub.status === 'paused';
                    const isCreated = sub.status === 'created';

                    return (
                      <div key={sub.id} className="border border-zinc-800/50 rounded-lg overflow-hidden">
                        {/* Compact Row */}
                        <button
                          onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-500" />
                            )}
                            <Badge className={`${getStatusColor(sub.status)} text-[10px]`}>
                              {sub.status}
                            </Badge>
                            <span className="text-sm text-zinc-300">
                              {sub.customer_email || sub.customer_contact || 'No customer info'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-zinc-500">
                              {sub.paid_count || 0}/{sub.total_count || 0} paid
                            </span>
                            <Badge variant="outline" className="text-[10px] text-zinc-600 border-zinc-700">
                              {sub.environment}
                            </Badge>
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50 bg-zinc-900/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Subscription ID</p>
                                <code className="text-xs text-zinc-300 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                  {sub.id}
                                </code>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Plan ID</p>
                                <code className="text-xs text-zinc-300 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                  {sub.plan_id}
                                </code>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Started</p>
                                <span className="text-xs text-zinc-300">{formatDate(sub.current_start)}</span>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Next Charge</p>
                                <span className="text-xs text-zinc-300">{formatDate(sub.current_end)}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/50">
                              {isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePause(sub.id)}
                                  disabled={actionLoading === sub.id}
                                  className="h-7 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-white"
                                >
                                  <Pause className="w-3 h-3 mr-1" />
                                  {actionLoading === sub.id ? 'Pausing...' : 'Pause'}
                                </Button>
                              )}
                              {isPaused && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResume(sub.id)}
                                  disabled={actionLoading === sub.id}
                                  className="h-7 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  {actionLoading === sub.id ? 'Resuming...' : 'Resume'}
                                </Button>
                              )}
                              {!isCreated && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(sub.id)}
                                  disabled={actionLoading === sub.id}
                                  className="h-7 text-xs bg-transparent border-zinc-700 text-red-400 hover:bg-red-500/10"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              {sub.short_url && (
                                <a
                                  href={sub.short_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
                                >
                                  Payment Link <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Pagination
                    currentPage={subsPage}
                    totalPages={subsTotalPages}
                    totalItems={filteredSubscriptions.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setSubsPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
}
