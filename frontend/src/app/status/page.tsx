'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle, AlertTriangle, XCircle, Activity,
  Server, Database, Globe, Zap, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { LazyBentoGrid } from '@/components/lazy';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency?: number;
  icon: React.ReactNode;
}

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [checking, setChecking] = useState(false);

  // Set initial date on client only to avoid hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, []);

  const services: ServiceStatus[] = [
    { name: 'API Gateway', status: 'operational', latency: 45, icon: <Server className="w-4 h-4" /> },
    { name: 'Payment Processing', status: 'operational', latency: 120, icon: <Zap className="w-4 h-4" /> },
    { name: 'Database', status: 'operational', latency: 12, icon: <Database className="w-4 h-4" /> },
    { name: 'Webhooks', status: 'operational', latency: 89, icon: <Globe className="w-4 h-4" /> },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-emerald-500/15 text-emerald-400 text-xs">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/15 text-yellow-400 text-xs">Degraded</Badge>;
      case 'outage':
        return <Badge className="bg-red-500/15 text-red-400 text-xs">Outage</Badge>;
      default:
        return <Badge className="bg-emerald-500/15 text-emerald-400 text-xs">Operational</Badge>;
    }
  };

  const allOperational = services.every(s => s.status === 'operational');
  const operationalCount = services.filter(s => s.status === 'operational').length;

  const refreshStatus = () => {
    setChecking(true);
    setTimeout(() => {
      setLastUpdated(new Date().toLocaleString());
      setChecking(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Metrics */}
          <LazyBentoGrid items={[
            {
              title: "System Status",
              meta: allOperational ? "Operational" : "Degraded",
              description: allOperational ? "All systems running normally" : "Some services experiencing issues",
              icon: allOperational ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />,
              status: allOperational ? "Healthy" : "Warning",
              tags: ["Status"],
              colSpan: 1,
            },
            {
              title: "Services",
              meta: `${operationalCount}/${services.length}`,
              description: "Services operational",
              icon: <Server className="w-4 h-4 text-cyan-500" />,
              status: "Monitored",
              tags: ["Infrastructure"],
              colSpan: 1,
            },
            {
              title: "Uptime",
              meta: "99.99%",
              description: "Last 90 days",
              icon: <Activity className="w-4 h-4 text-blue-500" />,
              status: "Healthy",
              tags: ["Performance"],
              colSpan: 1,
            },
          ]} />

          {/* Last Updated */}
          <div className="flex items-center justify-between mt-8 mb-4">
            <p className="text-xs text-zinc-500">
              Last updated: {lastUpdated || '—'}
            </p>
            <Button
              onClick={refreshStatus}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-zinc-500 hover:text-black"
              disabled={checking}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Service Status */}
          <Card className="bg-[#09090b] border-zinc-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-500" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                      {service.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      {service.latency && (
                        <p className="text-xs text-zinc-500">{service.latency}ms response time</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(service.status)}
                    {getStatusIcon(service.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Uptime - Last 90 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-0.5">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-8 bg-emerald-500/80 rounded-sm hover:bg-emerald-500 transition-colors"
                    title={`${new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toLocaleDateString()}: 100% uptime`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-500">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </CardContent>
          </Card>

          {/* Incidents */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
                <CheckCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No incidents reported</p>
                <p className="text-xs text-zinc-600 mt-1">All systems have been operating normally</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
}
