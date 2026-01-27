'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClientApiCall } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Settings, Loader2, Pencil, Key, Shield } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditServiceModal } from '@/components/EditServiceModal';

interface Service {
  id: string;
  service_name: string;
  environment: string;
  features: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  credential_hint: string;  // Masked credential prefix (e.g., "rzp_test_Rrql***")
}



export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEnvironment, setCurrentEnvironment] = useState<'test' | 'live'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onerouter_environment');
      return (saved === 'live' || saved === 'test') ? saved : 'test';
    }
    return 'test';
  });
  // const [environments, setEnvironments] = useState<Record<string, { test: Environment; live: Environment }>>({});
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const apiClient = useClientApiCall();

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/api/services?environment=${currentEnvironment}`);
      setServices((response as { services: Service[] }).services || []);
      setServicesData((response as { services: Service[] }).services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
      setServicesData([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient, currentEnvironment]);

  const handleEnvironmentChange = useCallback((env: 'test' | 'live') => {
    setCurrentEnvironment(env);
    localStorage.setItem('onerouter_environment', env);
  }, []);

  // Load services whenever currentEnvironment changes
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // const switchEnvironment = async (serviceName: string, newEnv: 'test' | 'live') => {
  //   try {
  //     await apiClient(`/api/services/${serviceName}/switch-environment`, {
  //       method: 'POST',
  //       body: JSON.stringify({ environment: newEnv })
  //     });
  //     await loadServices();
  //   } catch (error) {
  //     console.error('Failed to switch environment:', error);
  //   }
  // };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-white font-sans border-t border-white/10">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <GlobalEnvironmentToggle 
                  services={servicesData} 
                  onGlobalSwitch={handleEnvironmentChange}
                  apiClient={apiClient}
                />
                <div className="px-4 rounded-full text-sm font-medium text-cyan-500 transition-all duration-300 hover:bg-cyan-500/10">
                  Free Plan
                </div>
                <Link href="/api-keys" className="w-full sm:w-auto">
                  <Button className="text-white hover:bg-[#1a1a1a] border-0 transition-all duration-300 hover:shadow-md hover:shadow-blue-300 hover:scale-105 w-full sm:w-auto">
                    Manage API Keys
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">

          <div className="relative z-10">
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

            {/* Services Metrics */}
            <BentoGrid items={[
              {
                title: "Connected Services",
                meta: `${services.length} active in ${currentEnvironment}`,
                description: "Payment providers and integrations configured",
                icon: <CheckCircle2 className="w-4 h-4 text-cyan-500" />,
                status: "Active",
                tags: ["Integration", "Payments"],
                colSpan: 2,
                hasPersistentHover: true,
              },
              {
                title: "Environments",
                meta: "Test & Live",
                description: "Switch between testing and production modes",
                icon: <Settings className="w-4 h-4 text-cyan-500" />,
                status: "Configured",
                tags: ["Environment", "Testing"],
              },
            ]} />

            {/* Connected Services Table */}
            <Card className="bg-black border border-black mt-8 hover:border-black transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                      <Shield className="w-5 h-5" />
                    </div>
                    Service Credentials ({currentEnvironment.toUpperCase()})
                  </CardTitle>
                  <Badge className={`${
                    currentEnvironment === 'live'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  } border`}>
                    {currentEnvironment.toUpperCase()} MODE
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto border border-cyan-500/20">
                      <Key className="w-8 h-8 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No {currentEnvironment} credentials configured</h3>
                    <p className="text-[#888] mb-6">Configure your {currentEnvironment} environment credentials to get started</p>
                    <Link href="/onboarding">
                      <Button className="bg-cyan-500 text-white hover:bg-cyan-600">
                        Add Credentials
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-black border border-[#222] rounded-2xl overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#222] bg-black">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Service</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Credential</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Environment</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Created</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((service, index) => (
                            <tr
                              key={service.id}
                              className={`border-b border-[#222] hover:bg-[#111] transition-colors ${
                                index === services.length - 1 ? 'border-b-0' : ''
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
                                    <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                                  </div>
                                  <span className="text-white font-medium capitalize">{service.service_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <code className="text-[#888] text-sm font-mono bg-[#1a1a1a] px-2 py-1 rounded">
                                  {service.credential_hint || '***configured***'}
                                </code>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={`${
                                  service.environment === 'live'
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                } border`}>
                                  {service.environment.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-green-400 text-sm">Active</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[#888] text-sm">
                                  {service.created_at ? new Date(service.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <EditServiceModal
                                  service={service}
                                  trigger={
                                    <button
                                      className="p-2 rounded-lg hover:bg-[#222] transition-colors"
                                      title="Edit credentials"
                                    >
                                      <Pencil className="w-4 h-4 text-[#888] hover:text-cyan-400" />
                                    </button>
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4 p-4">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="border border-[#222] rounded-xl p-4 hover:bg-[#111] transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
                                <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                              </div>
                              <div>
                                <p className="text-white font-medium capitalize">{service.service_name}</p>
                                <code className="text-[#666] text-xs font-mono">
                                  {service.credential_hint || '***configured***'}
                                </code>
                              </div>
                            </div>
                            <Badge className={`${
                              service.environment === 'live'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            } border`}>
                              {service.environment.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-[#222]">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-400 text-xs">Active</span>
                            </div>
                            <EditServiceModal
                              service={service}
                              trigger={
                                <button className="p-2 rounded-lg hover:bg-[#222] transition-colors">
                                  <Pencil className="w-4 h-4 text-[#888]" />
                                </button>
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Service Button */}
                {services.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#333]">
                    <div className="flex items-center justify-center">
                      <Link href="/onboarding">
                        <Button className="bg-transparent border-2 border-dashed border-[#333] text-[#888] hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-xl py-3 px-6 transition-all duration-300">
                          <span className="mr-2">+</span> Add More Services
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}