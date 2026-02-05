'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClientApiCall } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User, Shield, Bell, Lock, Key, AlertTriangle,
  Mail, MessageSquare, Webhook, Loader2, Save, Trash2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';

interface Service {
  id: string;
  service_name: string;
  environment: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const apiClient = useClientApiCall();
  const [notifications, setNotifications] = useState({
    email: true,
    webhook: false,
    sms: false,
  });

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient('/api/services');
      setServices((response as { services: Service[] }).services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const notificationIcons: Record<string, React.ReactNode> = {
    email: <Mail className="w-4 h-4 text-zinc-400" />,
    webhook: <Webhook className="w-4 h-4 text-zinc-400" />,
    sms: <MessageSquare className="w-4 h-4 text-zinc-400" />,
  };

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
          {/* Overview Metrics */}
          <BentoGrid items={[
            {
              title: "Account Status",
              meta: "Active",
              description: "Your OneRouter account is in good standing",
              icon: <User className="w-4 h-4 text-emerald-500" />,
              status: "Active",
              tags: ["Profile"],
              colSpan: 1,
            },
            {
              title: "Security Level",
              meta: "Medium",
              description: "Enable 2FA for enhanced security",
              icon: <Shield className="w-4 h-4 text-yellow-500" />,
              status: "Medium",
              tags: ["Security"],
              colSpan: 1,
            },
            {
              title: "Connected Services",
              meta: `${services.length}`,
              description: "Payment providers configured",
              icon: <Key className="w-4 h-4 text-cyan-500" />,
              status: services.length > 0 ? "Active" : "None",
              tags: ["Services"],
              colSpan: 1,
            },
          ]} />

          {/* Profile Settings */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <User className="w-5 h-5 text-cyan-500" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.fullName || ''}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-zinc-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="Your Company"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:border-zinc-700 focus:outline-none transition-colors"
                />
              </div>
              <Button
                disabled={saving}
                className="bg-white text-black hover:bg-zinc-200 text-sm h-9"
              >
                <Save className="w-3.5 h-3.5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <Bell className="w-5 h-5 text-cyan-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(notifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {notificationIcons[key]}
                      <div>
                        <p className="text-sm text-white capitalize">{key} Notifications</p>
                        <p className="text-xs text-zinc-500">
                          Receive {key} alerts for important events
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        value ? 'bg-cyan-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          value ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <Lock className="w-5 h-5 text-cyan-500" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-sm text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-zinc-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-black hover:border-zinc-600">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-sm text-white">API Key Rotation</p>
                      <p className="text-xs text-zinc-500">Auto-rotate keys every 90 days</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-black hover:border-zinc-600">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-[#09090b] border-red-500/20 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-red-400 flex items-center gap-3 text-lg">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div>
                  <p className="text-sm text-red-400">Delete Account</p>
                  <p className="text-xs text-zinc-500">Permanently delete your account and all data</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
}
