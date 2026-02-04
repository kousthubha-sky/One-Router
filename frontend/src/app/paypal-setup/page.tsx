"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useClientApiCall } from "@/lib/api-client";
import { ArrowLeft, Loader2, Check, ExternalLink, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";

function PayPalSetupContent() {
  const apiClient = useClientApiCall();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEnv = searchParams.get("environment") === "live" ? "live" : "test";

  const [env, setEnv] = useState<"test" | "live">(initialEnv);
  const [configured, setConfigured] = useState({ test: false, live: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookId, setWebhookId] = useState("");

  useEffect(() => {
    apiClient("/api/paypal/status")
      .then((res: Record<string, unknown>) => {
        const test = res.test as { configured: boolean } | undefined;
        const live = res.live as { configured: boolean } | undefined;
        setConfigured({
          test: test?.configured ?? false,
          live: live?.configured ?? false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await apiClient("/api/paypal/credentials", {
        method: "POST",
        body: JSON.stringify({
          environment: env,
          client_id: clientId,
          client_secret: clientSecret,
          webhook_id: webhookId || null,
        }),
      });
      setSuccess("Saved");
      setConfigured((c) => ({ ...c, [env]: true }));
      setTimeout(() => router.push("/services"), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = env === "test" ? configured.test : configured.live;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#09090b]">
        {/* Compact Header */}
        <div className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
            <Link href="/services" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Services</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="w-5 h-5 rounded" />
              <span className="text-sm font-medium">PayPal</span>
            </div>
            <a
              href="https://developer.paypal.com/dashboard/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
            >
              Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : (
            <>
              {/* Environment Toggle */}
              <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg mb-5 w-fit">
                {(["test", "live"] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEnv(e)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                      env === e
                        ? e === "live"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-blue-500/15 text-blue-400"
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {e === "test" ? "Sandbox" : "Live"}
                    {configured[e] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                ))}
              </div>

              {/* Status */}
              {isConfigured && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-5 text-xs text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  {env === "live" ? "Live" : "Sandbox"} credentials configured
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                    <span>Client ID</span>
                    <button
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
                    >
                      {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </label>
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder={env === "live" ? "Live Client ID" : "Sandbox Client ID"}
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Client Secret</label>
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Client Secret"
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Webhook ID <span className="text-zinc-700">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={webhookId}
                    onChange={(e) => setWebhookId(e.target.value)}
                    placeholder="For payment notifications"
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  {success}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={save}
                disabled={saving || !clientId || !clientSecret}
                className="w-full mt-5 px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Save"}
              </button>

              <p className="text-[10px] text-zinc-700 text-center mt-4">
                Credentials are encrypted with AES-256
              </p>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PayPalSetupPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      </DashboardLayout>
    }>
      <PayPalSetupContent />
    </Suspense>
  );
}
