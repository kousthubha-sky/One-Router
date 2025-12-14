import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/api-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Key, BarChart3, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user data from our API
  const apiKeysCount = 0;
  const transactionsCount = 0;
  const servicesCount = 0;
  
  let userDisplayName = `User ID: ${userId}`;

  try {
    const userProfile = await getUserProfile();
    if (userProfile.first_name || userProfile.last_name) {
      userDisplayName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className=" shadow-sm ">
        <div className="max-w-4xl bg-[#1a1a1a]/50 rounded-4xl  mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-[#00ff88]" />
                <h1 className="text-2xl font-bold font-mono">Dashboard</h1>
              </div>
              <p className="text-sm text-[#888] font-mono">Welcome back</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-[#1a1a1a] border border-[#00ff88] text-[#00ff88] px-3 py-1 font-mono">
                Free Plan
              </Badge>
              <Link href="/api-keys">
                <Button className="bg-[#00ff88] text-black hover:bg-[#00dd77] font-mono font-bold">
                  Manage API Keys
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="bg-[#0a0a0a] border-[#222] hover:border-[#00ff88] transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#888] font-mono">API Keys</p>
                    <p className="text-3xl font-bold text-[#00ff88] font-mono">{apiKeysCount}</p>
                    <p className="text-xs text-[#666] font-mono mt-1">Active API keys</p>
                  </div>
                  <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center">
                    <Key className="w-6 h-6 text-[#00ff88]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0a] border-[#222] hover:border-[#00ff88] transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#888] font-mono">Transactions</p>
                    <p className="text-3xl font-bold text-[#00ff88] font-mono">{transactionsCount}</p>
                    <p className="text-xs text-[#666] font-mono mt-1">Total API calls</p>
                  </div>
                  <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-[#00ff88]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0a] border-[#222] hover:border-[#00ff88] transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#888] font-mono">Services</p>
                    <p className="text-3xl font-bold text-[#00ff88] font-mono">{servicesCount}</p>
                    <p className="text-xs text-[#666] font-mono mt-1">Connected providers</p>
                  </div>
                  <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-[#00ff88]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-[#0a0a0a] border-[#222]">
              <CardHeader>
                <CardTitle className="font-mono text-white">🚀 Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#222] rounded-lg hover:border-[#00ff88] transition-colors">
                    <div className="w-8 h-8 bg-[#00ff88]/10 rounded-full flex items-center justify-center border border-[#00ff88]">
                      <span className="text-[#00ff88] text-sm font-semibold font-mono">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-white font-mono">Upload Environment File</p>
                      <p className="text-sm text-[#888] font-mono">Connect your payment services automatically</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#222] rounded-lg hover:border-[#00ff88] transition-colors">
                    <div className="w-8 h-8 bg-[#00ff88]/10 rounded-full flex items-center justify-center border border-[#00ff88]">
                      <span className="text-[#00ff88] text-sm font-semibold font-mono">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-white font-mono">Generate API Keys</p>
                      <p className="text-sm text-[#888] font-mono">Create secure keys for your applications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#222] rounded-lg hover:border-[#00ff88] transition-colors">
                    <div className="w-8 h-8 bg-[#00ff88]/10 rounded-full flex items-center justify-center border border-[#00ff88]">
                      <span className="text-[#00ff88] text-sm font-semibold font-mono">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-white font-mono">Start Integrating</p>
                      <p className="text-sm text-[#888] font-mono">Use our SDK in your applications</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/onboarding">
                    <Button className="w-full bg-[#00ff88] text-black hover:bg-[#00dd77] font-mono font-bold">
                      Start Onboarding →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0a] border-[#222]">
              <CardHeader>
                <CardTitle className="font-mono text-white">📊 Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#222] rounded-lg">
                    <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white font-mono">Account created</p>
                      <p className="text-xs text-[#888] font-mono">Just now</p>
                    </div>
                  </div>
                  <div className="text-center py-8 text-[#666] text-sm font-mono border border-dashed border-[#222] rounded-lg">
                    No recent transactions yet
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Guide */}
          <Card className="bg-[#0a0a0a] border-[#222]">
            <CardHeader>
              <CardTitle className="font-mono text-white">🎯 Getting Started Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-[#1a1a1a] border border-[#222] rounded-lg hover:border-[#00ff88] transition-colors">
                  <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#00ff88]">
                    <span className="text-[#00ff88] text-xl">📁</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2 font-mono">1. Upload Credentials</h3>
                  <p className="text-sm text-[#888] font-mono">Upload your .env file with payment service credentials</p>
                </div>
                <div className="text-center p-4 bg-[#1a1a1a] border border-[#222] rounded-lg hover:border-[#00ff88] transition-colors">
                  <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#00ff88]">
                    <span className="text-[#00ff88] text-xl">🔑</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2 font-mono">2. Generate Keys</h3>
                  <p className="text-sm text-[#888] font-mono">Create secure API keys for your applications</p>
                </div>
                <div className="text-center p-4 bg-[#1a1a1a] border border-[#222] rounded-lg hover:border-[#00ff88] transition-colors">
                  <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#00ff88]">
                    <span className="text-[#00ff88] text-xl">🚀</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2 font-mono">3. Start Building</h3>
                  <p className="text-sm text-[#888] font-mono">Integrate OneRouter into your applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}