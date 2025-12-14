'use client';

import { useState, useEffect } from 'react';
import { useClientApiCall } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Key, Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

const LoadingDots = () => (
  <div className="flex gap-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-[#00ff88]"
        style={{
          animation: "pulse 1s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

export const dynamic = 'force-dynamic';

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const clientApiCall = useClientApiCall();

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      // For now, just show empty state
      setApiKeys([]);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = async () => {
    setGenerating(true);
    try {
      const data = await clientApiCall('/api/keys', {
        method: 'POST',
      });
      setNewKey(data.api_key);
      loadAPIKeys(); // Refresh the list
    } catch (error) {
      console.error('Failed to generate API key:', error);
      alert('Failed to generate API key. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingDots />
          <p className="mt-4 text-[#888] font-mono">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-[#0a0a0a] shadow-sm border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Key className="w-6 h-6 text-[#00ff88]" />
                <h1 className="text-2xl font-bold font-mono">API Keys</h1>
              </div>
              <p className="text-sm text-[#888] font-mono">Manage your application access keys</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="bg-transparent border-[#222] text-white hover:border-[#00ff88] font-mono"
                >
                  ← Dashboard
                </Button>
              </Link>
              <Button
                onClick={generateAPIKey}
                disabled={generating}
                className="bg-[#00ff88] text-black hover:bg-[#00dd77] font-mono font-bold"
              >
                {generating ? (
                  <>
                    <LoadingDots />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Key
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {newKey && (
            <div className="mb-6 bg-[#ffbd2e]/10 border border-[#ffbd2e] rounded-lg p-4">
              <div className="flex">
                <div className="flex shrink-0">
                  <AlertTriangle className="h-5 w-5 text-[#ffbd2e]" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-[#ffbd2e] font-mono">
                    New API Key Generated
                  </h3>
                  <div className="mt-2 text-sm text-[#ffbd2e]">
                    <div className="flex items-center gap-2 font-mono bg-[#1a1a1a] p-3 rounded border border-[#222]">
                      <code className="flex-1 text-[#00ff88]">{newKey}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(newKey)}
                        className="px-3 py-1 bg-[#00ff88] text-black rounded hover:bg-[#00dd77] transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="mt-2 font-mono">
                      <strong>Important:</strong> Copy this key now. It will not be shown again for security reasons.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setNewKey(null)}
                      className="px-3 py-1 bg-[#ffbd2e] text-black text-sm rounded hover:bg-[#ffaa00] font-mono font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {apiKeys.length === 0 ? (
            <Card className="text-center py-12 bg-[#0a0a0a] border-[#222]">
              <CardContent className="pt-6">
                <div className="mx-auto w-16 h-16 bg-[#00ff88]/10 rounded-full flex items-center justify-center mb-6 border-2 border-[#00ff88]">
                  <Key className="w-8 h-8 text-[#00ff88]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-mono">No API keys yet</h3>
                <p className="text-[#888] mb-6 max-w-sm mx-auto font-mono">
                  Generate your first API key to start integrating OneRouter into your applications.
                </p>
                <Button
                  onClick={generateAPIKey}
                  disabled={generating}
                  className="bg-[#00ff88] text-black hover:bg-[#00dd77] font-mono font-bold"
                >
                  {generating ? (
                    <>
                      <LoadingDots />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Your First API Key
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222]">
                <h3 className="text-lg font-medium text-white font-mono">Your API Keys</h3>
                <p className="text-sm text-[#888] font-mono">Manage and monitor your API access</p>
              </div>
              <div className="divide-y divide-[#222]">
                {apiKeys.map((key) => (
                  <div key={key.id} className="px-6 py-4 hover:bg-[#1a1a1a] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#00ff88]/10 rounded-lg flex items-center justify-center border border-[#00ff88]">
                          <Key className="w-5 h-5 text-[#00ff88]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white font-mono">{key.name}</p>
                            <Badge
                              variant={key.is_active ? "default" : "destructive"}
                              className={key.is_active ? "bg-[#00ff88] text-black border-0" : ""}
                            >
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <code className="text-xs bg-[#1a1a1a] border border-[#222] px-2 py-1 rounded font-mono text-[#00ff88]">
                              {key.prefix}••••••••
                            </code>
                            <span className="text-xs text-[#888] font-mono">
                              Created {new Date(key.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:text-[#00ff88]"
                          onClick={() => navigator.clipboard.writeText(`${key.prefix}••••••••`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-[#222] text-white hover:border-[#00ff88]"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-[#ff3366] hover:bg-[#ff1a4f] text-white"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Info */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
              <Shield className="w-5 h-5 text-[#00ff88] flex shrink-0 mt-0.5" />
              <div>
                <h3 className="font-mono font-bold text-sm mb-1 text-white">AES-256 Encryption</h3>
                <p className="text-xs text-[#888] font-mono">Your keys are encrypted at rest</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
              <Shield className="w-5 h-5 text-[#00ff88] flex shrink-0 mt-0.5" />
              <div>
                <h3 className="font-mono font-bold text-sm mb-1 text-white">Rate Limiting</h3>
                <p className="text-xs text-[#888] font-mono">Automatic rate limiting protection</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
              <Shield className="w-5 h-5 text-[#00ff88] flex shrink-0 mt-0.5" />
              <div>
                <h3 className="font-mono font-bold text-sm mb-1 text-white">Audit Logging</h3>
                <p className="text-xs text-[#888] font-mono">Complete access logs available</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}