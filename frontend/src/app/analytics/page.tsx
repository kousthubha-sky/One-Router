// frontend/src/app/analytics/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Clock, DollarSign, BarChart3 } from "lucide-react";
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);

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

  useEffect(() => {
    loadAnalytics();
    loadServices();
  }, [period, loadAnalytics, loadServices]);

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
                <div className="px-4 rounded-full text-sm font-medium text-cyan-500 transition-all duration-300 hover:bg-cyan-500/10">
                  Free Plan
                </div>
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
                <Button variant="outline" onClick={loadAnalytics} className="bg-transparent border-[#222] text-white hover:border-cyan-500">
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden border border-white/10 [mask-image:linear-gradient(to_bottom,white_0%,white_80%,transparent_100%)]">
            {/* Top-left corner */}
            <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-cyan-500/30"></div>
            {/* Top-right corner */}
            <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-cyan-500/30"></div>
            {/* Bottom-left corner */}
            <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-cyan-500/30"></div>
            {/* Bottom-right corner */}
            <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-cyan-500/30"></div>
          </div>
          <div className="relative z-10">
            {/* Analytics Overview */}
            {overview && (
              <BentoGrid items={[
                {
                  title: "Total API Calls",
                  meta: (overview.total_calls || 0).toLocaleString(),
                  description: "API requests processed in selected period",
                  icon: <Activity className="w-4 h-4 text-cyan-500" />,
                  status: "Active",
                  tags: ["Requests", "Traffic"],
                  colSpan: 2,
                  hasPersistentHover: true,
                },
                {
                  title: "Success Rate",
                  meta: overview.success_rate ? `${(overview.success_rate * 100).toFixed(1)}%` : "0%",
                  description: "Percentage of successful API calls",
                  icon: <TrendingUp className="w-4 h-4 text-cyan-500" />,
                  status: overview.success_rate && overview.success_rate > 0.95 ? "Excellent" : "Good",
                  tags: ["Performance", "Reliability"],
                },
                {
                  title: "Avg Response Time",
                  meta: overview.avg_response_time ? `${overview.avg_response_time.toFixed(0)}ms` : "0ms",
                  description: "Average API response time",
                  icon: <Clock className="w-4 h-4 text-cyan-500" />,
                  status: overview.avg_response_time && overview.avg_response_time < 500 ? "Fast" : "Normal",
                  tags: ["Performance", "Speed"],
                },
                {
                  title: "Total Cost",
                  meta: overview.total_cost ? `$${overview.total_cost.toFixed(2)}` : "$0.00",
                  description: overview.projected_monthly ? `Projected monthly: $${overview.projected_monthly.toFixed(2)}` : "No cost data available",
                  icon: <DollarSign className="w-4 h-4 text-cyan-500" />,
                  status: "Tracked",
                  tags: ["Billing", "Usage"],
                },
              ]} />
            )}

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Time Series Chart */}
              <Card className="bg-[#0a0a0a] border border-[#222] hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3 text-xl">
                    API Call Volume
                  </CardTitle>
                  <CardDescription className="text-[#888]">Daily API calls over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {timeSeries?.daily_volume && timeSeries.daily_volume.length > 0 ? (
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
                    <div className="flex items-center justify-center h-32 text-[#666] border border-dashed border-[#333] rounded-xl bg-[#1a1a1a]">
                      <div className="text-center">
                        <BarChart3 className="w-8 h-8 text-[#666] mx-auto mb-2" />
                        <p className="mb-2">No data available for selected period</p>
                        <p className="text-xs">Make some API calls to see analytics</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Performance */}
              <Card className="bg-[#0a0a0a] border border-[#222] hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
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
                    <div className="flex items-center justify-center h-32 text-[#666] border border-dashed border-[#333] rounded-xl bg-[#1a1a1a]">
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 text-[#666] mx-auto mb-2" />
                        <p className="mb-2">No service data available</p>
                        <p className="text-xs">Connect services to see performance</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}