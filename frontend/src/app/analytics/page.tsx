// frontend/src/app/analytics/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Activity, TrendingUp, Clock, DollarSign, BarChart3,
  Zap, ArrowRight, CreditCard, MessageSquare, Mail,
  CheckCircle2, RefreshCw
} from "lucide-react";
import { useClientApiCall } from "@/lib/api-client";
import DashboardLayout from "@/components/DashboardLayout";
import { GlobalEnvironmentToggle } from "@/components/GlobalEnvironmentToggle";
import { BentoGrid } from "@/components/ui/bento-grid";
import Link from "next/link";

interface AnalyticsOverview {
  period: string;
  since_date: string;
  total_calls: number;
  success_rate: number;
  avg_response_time: number;
  top_services: Array<{ service: string; calls: number }>;
  error_rate_by_service: Record<string, number>;
  cost_breakdown: Record<string, number>;
  total_cost: number;
  projected_monthly: number;
}

interface TimeSeriesData {
  daily_volume: Array<{ date: string; calls: number; errors: number; avg_response_time: number }>;
}

interface Service {
  id: string;
  service_name: string;
  environment: string;
}

interface BalanceData {
  balance: number;
  total_purchased: number;
  total_consumed: number;
}

const QUICK_ACTIONS = [
  {
    title: "Set up Razorpay",
    description: "Accept INR payments",
    href: "/razorpay-setup",
    icon: CreditCard,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10"
  },
  {
    title: "Set up Twilio",
    description: "Send SMS messages",
    href: "/twilio-setup",
    icon: MessageSquare,
    color: "text-red-400",
    bgColor: "bg-red-500/10"
  },
  {
    title: "Set up Resend",
    description: "Send emails",
    href: "/resend-setup",
    icon: Mail,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10"
  },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [balance, setBalance] = useState<BalanceData | null>(null);

  const apiClient = useClientApiCall();

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, timeSeriesRes] = await Promise.all([
        apiClient(`/api/analytics/overview?period=${period}`),
        apiClient(`/api/analytics/timeseries?period=${period}`)
      ]);

      setOverview(overviewRes as unknown as AnalyticsOverview);
      setTimeSeries(timeSeriesRes as unknown as TimeSeriesData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, period]);

  const loadServices = useCallback(async () => {
    try {
      const response = await apiClient('/api/services');
      setServices((response as { services: Service[] }).services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    }
  }, [apiClient]);

  const loadBalance = useCallback(async () => {
    try {
      const response = await apiClient('/v1/credits/balance');
      setBalance(response as unknown as BalanceData);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  }, [apiClient]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAnalytics(), loadBalance()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAnalytics();
    loadServices();
    loadBalance();
  }, [period, loadAnalytics, loadServices, loadBalance]);

  const hasData = overview && (overview.total_calls > 0 || services.length > 0);
  const hasServices = services.length > 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-white font-sans border-t border-white/10">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
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
              <div className="flex items-center space-x-4">
                <GlobalEnvironmentToggle services={services} />
                {balance && (
                  <Link href="/credits" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-400">${(balance.balance * 0.01).toFixed(2)}</span>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-32 bg-[#0a0a0a] border-[#222] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-transparent border-[#222] text-white hover:border-cyan-500"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
          {/* Empty State - No Services */}
          {!hasServices && (
            <div className="mb-8">
              <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
                <CardContent className="p-8">
                  <div className="text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 mx-auto bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Get Started with OneRouter</h2>
                    <p className="text-zinc-400 mb-6">
                      Connect your first service to start seeing analytics. Set up a payment provider or communication service to begin.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {QUICK_ACTIONS.map((action) => (
                        <Link
                          key={action.title}
                          href={action.href}
                          className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all group"
                        >
                          <div className={`p-2 rounded-lg ${action.bgColor}`}>
                            <action.icon className={`w-4 h-4 ${action.color}`} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{action.title}</p>
                            <p className="text-xs text-zinc-500">{action.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Overview */}
          {hasServices && (
            <>
              <BentoGrid items={[
                {
                  title: "Total API Calls",
                  meta: (overview?.total_calls || 0).toLocaleString(),
                  description: `API requests in last ${period === '7d' ? '7 days' : period === '30d' ? '30 days' : period === '90d' ? '90 days' : 'year'}`,
                  icon: <Activity className="w-4 h-4 text-cyan-500" />,
                  status: overview?.total_calls && overview.total_calls > 0 ? "Active" : "No calls yet",
                  tags: ["Requests", "Traffic"],
                  colSpan: 2,
                  hasPersistentHover: true,
                },
                {
                  title: "Success Rate",
                  meta: overview?.success_rate ? `${(overview.success_rate * 100).toFixed(1)}%` : "—",
                  description: overview?.total_calls ? "Percentage of successful calls" : "Make API calls to see rate",
                  icon: <TrendingUp className="w-4 h-4 text-cyan-500" />,
                  status: overview?.success_rate && overview.success_rate > 0.95 ? "Excellent" : overview?.success_rate && overview.success_rate > 0.8 ? "Good" : "—",
                  tags: ["Performance", "Reliability"],
                },
                {
                  title: "Avg Response Time",
                  meta: overview?.avg_response_time ? `${overview.avg_response_time.toFixed(0)}ms` : "—",
                  description: overview?.total_calls ? "Average API response time" : "Make API calls to see metrics",
                  icon: <Clock className="w-4 h-4 text-cyan-500" />,
                  status: overview?.avg_response_time && overview.avg_response_time < 500 ? "Fast" : overview?.avg_response_time ? "Normal" : "—",
                  tags: ["Performance", "Speed"],
                },
                {
                  title: "Credits Used",
                  meta: balance ? `$${(balance.total_consumed * 0.01).toFixed(2)}` : "$0.00",
                  description: balance?.balance ? `$${(balance.balance * 0.01).toFixed(2)} remaining` : "Add credits to get started",
                  icon: <DollarSign className="w-4 h-4 text-cyan-500" />,
                  status: "Tracked",
                  tags: ["Billing", "Usage"],
                },
              ]} />

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Time Series Chart */}
                <Card className="bg-[#0a0a0a] border border-[#222] hover:border-cyan-500/50 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center gap-3 text-xl">
                      API Call Volume
                    </CardTitle>
                    <CardDescription className="text-[#888]">Daily API calls over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {timeSeries?.daily_volume && timeSeries.daily_volume.some(d => d.calls > 0) ? (
                      <div className="space-y-4">
                        {/* Bar Chart Visualization */}
                        <div className="flex items-end gap-1 h-32 px-2">
                          {(() => {
                            const data = timeSeries.daily_volume.slice(-14);
                            const maxCalls = Math.max(...data.map(d => d.calls), 1);
                            return data.map((day, idx) => (
                              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className="w-full bg-cyan-500/80 rounded-t hover:bg-cyan-400 transition-colors relative group"
                                  style={{ height: `${(day.calls / maxCalls) * 100}%`, minHeight: day.calls > 0 ? '4px' : '0' }}
                                >
                                  {day.errors > 0 && (
                                    <div
                                      className="absolute bottom-0 w-full bg-red-500/80 rounded-t"
                                      style={{ height: `${(day.errors / day.calls) * 100}%` }}
                                    />
                                  )}
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {day.calls} calls{day.errors > 0 && `, ${day.errors} errors`}
                                  </div>
                                </div>
                                {idx % 2 === 0 && (
                                  <span className="text-[10px] text-gray-500">
                                    {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 justify-center">
                          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-500 rounded" /> Successful</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> Errors</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <BarChart3 className="w-10 h-10 text-zinc-700 mb-3" />
                        <p className="text-zinc-500 text-sm mb-1">No API calls yet</p>
                        <p className="text-zinc-600 text-xs mb-4">Make your first API call to see the chart</p>
                        <Link href="/docs#quickstart" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                          View Quick Start Guide <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Service Performance */}
                <Card className="bg-[#0a0a0a] border border-[#222] hover:border-cyan-500/50 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center gap-3 text-xl">
                      Service Performance
                    </CardTitle>
                    <CardDescription className="text-[#888]">Performance by service</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {overview?.top_services && overview.top_services.length > 0 ? (
                      <div className="space-y-3">
                        {(() => {
                          const maxCalls = Math.max(...overview.top_services.map(s => s.calls), 1);
                          return overview.top_services.slice(0, 5).map((service, index) => {
                            const errorRate = overview.error_rate_by_service?.[service.service] || 0;
                            return (
                              <div key={service.service} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-cyan-500 w-4">{index + 1}</span>
                                    <span className="text-sm font-medium text-white capitalize">{service.service}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-cyan-500 font-medium">{service.calls.toLocaleString()}</span>
                                    {errorRate > 0 && (
                                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                        {errorRate.toFixed(1)}% err
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all"
                                    style={{ width: `${(service.calls / maxCalls) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <TrendingUp className="w-10 h-10 text-zinc-700 mb-3" />
                        <p className="text-zinc-500 text-sm mb-1">No service data yet</p>
                        <p className="text-zinc-600 text-xs mb-4">Your configured services will appear here</p>
                        <Link href="/services" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                          View Services <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cost Breakdown */}
              {overview?.cost_breakdown && Object.keys(overview.cost_breakdown).length > 0 && (
                <Card className="bg-[#0a0a0a] border border-[#222] mt-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center gap-3 text-xl">
                      Cost Breakdown
                    </CardTitle>
                    <CardDescription className="text-[#888]">Spending by service</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(overview.cost_breakdown).map(([service, cost]) => (
                        <div key={service} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                          <p className="text-xs text-zinc-500 capitalize mb-1">{service}</p>
                          <p className="text-lg font-semibold text-white">${(cost as number).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Connected Services Summary */}
          {hasServices && (
            <Card className="bg-[#0a0a0a] border border-[#222] mt-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl">Connected Services</CardTitle>
                    <CardDescription className="text-[#888]">{services.length} service{services.length !== 1 ? 's' : ''} configured</CardDescription>
                  </div>
                  <Link href="/services">
                    <Button variant="outline" size="sm" className="bg-transparent border-zinc-700 text-white hover:border-cyan-500">
                      Manage Services
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {services.slice(0, 4).map((service) => (
                    <div key={service.id} className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{service.service_name}</p>
                        <p className="text-xs text-zinc-500">{service.environment}</p>
                      </div>
                    </div>
                  ))}
                  {services.length > 4 && (
                    <div className="flex items-center justify-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                      <p className="text-sm text-zinc-500">+{services.length - 4} more</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
