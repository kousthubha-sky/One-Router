import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Key, BarChart3, Link as LinkIcon, CheckCircle2, Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { GlobalEnvironmentToggle } from "@/components/GlobalEnvironmentToggle";
import { EditServiceModal } from "@/components/EditServiceModal";
import { BentoGrid } from "@/components/ui/bento-grid";
import { ConnectedServicesSection } from "@/components/ConnectedServicesSection";

interface Service {
  id: string;
  service_name: string;
  environment: string;
  features: Record<string, boolean>;
  credential_hint?: string;  // Masked credential prefix (e.g., "rzp_test_Rrql***")
}

interface RecentActivity {
  id: string;
  service_name: string;
  status: string;
  created_at: string;
  endpoint?: string;
}

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Server-side API call to check user services
async function getUserServices(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services?check_all=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { services: [], has_services: false, total_count: 0 };
    }

    return await response.json();
  } catch (error) {
    return { services: [], has_services: false, total_count: 0 };
  }
}

// Fetch API keys count
async function getApiKeysCount(token: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return 0;
    const data = await response.json();
    return data.api_keys?.length || 0;
  } catch {
    return 0;
  }
}

// Fetch analytics overview for transaction count
async function getAnalyticsOverview(token: string): Promise<{ total_calls: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/overview?period=30d`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { total_calls: 0 };
    return await response.json();
  } catch {
    return { total_calls: 0 };
  }
}

// Fetch recent activity (last 5 transactions)
async function getRecentActivity(token: string): Promise<RecentActivity[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/logs?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.logs || [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get authentication token
  const token = await getToken();

  if (!token) {
    redirect("/sign-in");
  }

  // Fetch all data in parallel
  const [servicesData, apiKeysCount, analyticsData, recentActivity] = await Promise.all([
    getUserServices(token),
    getApiKeysCount(token),
    getAnalyticsOverview(token),
    getRecentActivity(token),
  ]);

  const hasServices = servicesData.has_services;
  const services = servicesData.services || [];
  const transactionsCount = analyticsData.total_calls || 0;

  // Redirect to onboarding if no services are configured
  if (!hasServices || services.length === 0) {
    redirect("/onboarding");
  }

   return (
    <DashboardLayout>

      <div className=" text-white font-sans border-t border-white/10">
        <header className=" border-[#333] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-white/10 ">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6">

               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <GlobalEnvironmentToggle services={services} />
                  <div className="px-4 rounded-full text-sm font-medium text-cyan-500 transition-all duration-300 hover:bg-cyan-500/10">
                    Free Plan
                  </div>
                  
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

            <div className="space-y-8">
              {/* Metrics Cards - Bento Grid */}
              <BentoGrid items={[
             {
               title: "API Keys",
               meta: `${apiKeysCount} active`,
               description: "Manage your API keys and permissions for secure access",
               icon: <Key className="w-4 h-4 text-cyan-500" />,
               status: "Active",
               tags: ["Authentication", "Security"],
               colSpan: 2,
               hasPersistentHover: true,
             },
             {
               title: "Transactions",
               meta: `${transactionsCount} calls`,
               description: "Monitor your API usage and performance metrics",
               icon: <BarChart3 className="w-4 h-4 text-cyan-500" />,
               status: "Live",
               tags: ["Analytics"],
             },
             {
               title: "Services",
               meta: `${services.length} connected`,
               description: services.length === 0 ? "No providers connected yet" : "Connected payment providers active",
               icon: <LinkIcon className="w-4 h-4 text-cyan-500" />,
               status: services.length === 0 ? "Pending" : "Connected",
               tags: ["Integration"],
             },
           ]} />



           {/* Connected Services */}
           <Card className="bg-black border border-black mb-8 hover:border-black transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
             <CardHeader className="pb-6">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-white flex items-center gap-3 text-xl">
                   <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                     <Shield className="w-5 h-5" />
                   </div>
                   Connected Services
                 </CardTitle>
                 <div className="text-sm text-[#888] bg-[#1a1a1a] px-3 py-1 rounded-full border border-[#333]">
                   {services.length} active
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               <ConnectedServicesSection services={services} />
             </CardContent>
           </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#0a0a0a] border border-[#222]  transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-[#222] rounded-xl  transition-all duration-300 hover:bg-[#0f0f0f] group">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center  text-cyan-500 font-bold group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-white">Generate API Keys</p>
                      <p className="text-sm text-[#888]">Create keys for your applications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-[#222] rounded-xl  transition-all duration-300 hover:bg-[#0f0f0f] group">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center  text-cyan-500 font-bold group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-white">Read Documentation</p>
                      <p className="text-sm text-[#888]">Learn how to integrate OneRouter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-[#222] rounded-xl  transition-all duration-300 hover:bg-[#0f0f0f] group">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center  text-cyan-500 font-bold group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-white">Make Your First Call</p>
                      <p className="text-sm text-[#888]">Test the unified API</p>
                    </div>
                  </div>
                </div>
                <Link href="/api-keys">
                  <Button className="w-full bg-cyan-500 text-white  py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105">
                    Generate API Key →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0a] border border-[#222]  transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    <>
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4 p-3 bg-[#1a1a1a] border border-[#222] rounded-xl transition-all duration-300 hover:border-cyan-500/50 hover:bg-[#0f0f0f]">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            activity.status === 'success' ? 'bg-green-500' :
                            activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate capitalize">
                              {activity.service_name}
                            </p>
                            <p className="text-xs text-[#888] truncate">
                              {activity.endpoint || 'API Call'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${
                              activity.status === 'success'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {activity.status}
                            </Badge>
                            <p className="text-xs text-[#666] mt-1">
                              {new Date(activity.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link href="/analytics" className="block">
                        <Button variant="ghost" className="w-full text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10">
                          View All Activity →
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="text-center py-10 text-[#666] border border-dashed border-[#333] rounded-xl bg-[#1a1a1a]">
                      <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mb-3 mx-auto border border-cyan-500/20">
                        <BarChart3 className="w-5 h-5 text-cyan-500/50" />
                      </div>
                      <p className="text-sm mb-1">No API transactions yet</p>
                      <p className="text-xs text-[#555]">Make your first API call to see activity here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
        </main>
      </div>
    </DashboardLayout>
  );
}