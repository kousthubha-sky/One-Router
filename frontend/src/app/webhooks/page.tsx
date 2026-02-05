'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClientApiCall } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Webhook, Send, CheckCircle, XCircle, Clock,
  Loader2, Link2, Copy, ExternalLink, Activity
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { Pagination } from '@/components/ui/pagination';

interface Service {
  id: string;
  service_name: string;
  environment: string;
}

interface WebhookEvent {
  id: string;
  service_name: string;
  event_type: string;
  processed: boolean;
  created_at: string;
}

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [services, setServices] = useState<Service[]>([]);
  const [copiedService, setCopiedService] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const apiClient = useClientApiCall();

  const loadWebhookConfig = useCallback(async () => {
    try {
      await apiClient('/api/webhooks/configure');
    } catch {
      // Config not found
    }
  }, [apiClient]);

  const loadWebhookLogs = useCallback(async () => {
    try {
      const response = await apiClient('/api/webhooks/logs?limit=50');
      setEvents((response as { events: WebhookEvent[] }).events || []);
    } catch {
      setEvents([]);
    }
  }, [apiClient]);

  const loadServices = useCallback(async () => {
    try {
      const response = await apiClient('/api/services');
      setServices((response as { services: Service[] }).services || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    loadWebhookConfig();
    loadWebhookLogs();
    loadServices();
  }, [loadWebhookConfig, loadWebhookLogs, loadServices]);

  const saveWebhookUrl = async () => {
    if (!webhookUrl) return;
    setSaving(true);
    try {
      await apiClient('/api/webhooks/configure', {
        method: 'PUT',
        body: JSON.stringify({
          service_name: 'razorpay',
          webhook_url: webhookUrl,
          events: ['payment.success', 'payment.failed']
        })
      });
    } catch {
      // Error saving
    } finally {
      setSaving(false);
    }
  };

  const sendTestWebhook = async () => {
    setTestStatus('sending');
    try {
      await apiClient('/api/webhooks/test', {
        method: 'POST',
        body: JSON.stringify({ service_name: 'razorpay' })
      });
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const copyToClipboard = (service: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.onerouter.com'}/webhooks/${service}`;
    navigator.clipboard.writeText(url);
    setCopiedService(service);
    setTimeout(() => setCopiedService(null), 2000);
  };

  const processedCount = events.filter(e => e.processed).length;
  const successRate = events.length > 0 ? Math.round((processedCount / events.length) * 100) : 0;

  // Pagination
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const paginatedEvents = events.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              <GlobalEnvironmentToggle services={services} apiClient={apiClient} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Metrics */}
          <BentoGrid items={[
            {
              title: "Total Events",
              meta: `${events.length}`,
              description: "Webhook events received",
              icon: <Activity className="w-4 h-4 text-cyan-500" />,
              status: events.length > 0 ? "Active" : "Waiting",
              tags: ["Webhooks"],
              colSpan: 1,
            },
            {
              title: "Processed",
              meta: `${processedCount}`,
              description: "Successfully handled",
              icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
              status: successRate >= 90 ? "Healthy" : "Warning",
              tags: ["Success"],
              colSpan: 1,
            },
            {
              title: "Success Rate",
              meta: `${successRate}%`,
              description: "Event processing rate",
              icon: <Webhook className="w-4 h-4 text-blue-500" />,
              status: successRate >= 90 ? "Healthy" : successRate >= 70 ? "Warning" : "Critical",
              tags: ["Performance"],
              colSpan: 1,
            },
          ]} />

          {/* Configuration */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <Link2 className="w-5 h-5 text-cyan-500" />
                Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Your Endpoint */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">Your Webhook Endpoint</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-app.com/webhooks/onerouter"
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm font-mono focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                  <Button
                    onClick={saveWebhookUrl}
                    disabled={saving || !webhookUrl}
                    className="bg-white text-black hover:bg-zinc-200 text-sm h-10"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Events from all connected services will be forwarded to this URL
                </p>
              </div>

              {/* Test Webhook */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-white">Test Webhook</p>
                  <p className="text-xs text-zinc-500">Send a test event to verify your endpoint</p>
                </div>
                <div className="flex items-center gap-2">
                  {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                  <Button
                    onClick={sendTestWebhook}
                    disabled={testStatus !== 'idle' || !webhookUrl}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-black hover:border-zinc-600"
                  >
                    <Send className="w-3 h-3 mr-1.5" />
                    {testStatus === 'sending' ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OneRouter Endpoints */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <ExternalLink className="w-5 h-5 text-cyan-500" />
                OneRouter Webhook Endpoints
              </CardTitle>
              <p className="text-xs text-zinc-500 mt-1">
                Configure these URLs in your payment provider dashboards
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['razorpay', 'paypal', 'stripe'].map((service) => (
                  <div
                    key={service}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${service}&background=18181b&color=fff&size=24`}
                        alt={service}
                        className="w-6 h-6 rounded"
                      />
                      <div>
                        <p className="text-sm text-white capitalize">{service}</p>
                        <code className="text-xs text-zinc-500 font-mono">
                          {process.env.NEXT_PUBLIC_API_URL || 'https://api.onerouter.com'}/webhooks/{service}
                        </code>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(service)}
                      className="h-7 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-black hover:border-zinc-600"
                    >
                      {copiedService === service ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1.5 text-emerald-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-3 text-lg">
                  <Webhook className="w-5 h-5 text-cyan-500" />
                  Recent Events
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                  {events.length} events
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
                  <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No webhook events yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Events will appear here once configured</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                          {event.service_name}
                        </Badge>
                        <span className="text-sm text-white">{event.event_type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-600">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                        {event.processed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={events.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
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
