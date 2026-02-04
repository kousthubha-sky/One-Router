"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, AlertCircle, Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";

interface PayPalStatus {
  test: { configured: boolean; client_id_prefix: string | null };
  live: { configured: boolean; client_id_prefix: string | null };
  active_environment: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string;
  headers?: Record<string, string>;
}

interface Props {
  apiClient: (url: string, options?: RequestOptions) => Promise<Record<string, unknown>>;
}

export function PayPalSetup({ apiClient }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEnv = searchParams.get("environment") === "live" ? "live" : "test";

  const [environment, setEnvironment] = useState<"test" | "live">(initialEnv);
  const [status, setStatus] = useState<PayPalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookId, setWebhookId] = useState("");

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/api/paypal/status");
      setStatus(response as unknown as PayPalStatus);
    } catch {
      setStatus({
        test: { configured: false, client_id_prefix: null },
        live: { configured: false, client_id_prefix: null },
        active_environment: "test"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient("/api/paypal/validate-credentials", {
        method: "POST",
        body: JSON.stringify({ environment, client_id: clientId, client_secret: clientSecret }),
      });
      if (response.valid) {
        setSuccess("Credentials verified successfully");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient("/api/paypal/credentials", {
        method: "POST",
        body: JSON.stringify({
          environment,
          client_id: clientId,
          client_secret: clientSecret,
          webhook_id: webhookId || null,
        }),
      });
      if (response.success) {
        setSuccess("Credentials saved");
        setClientId("");
        setClientSecret("");
        setWebhookId("");
        await loadStatus();
        setTimeout(() => router.push("/services"), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  const currentEnvStatus = environment === "test" ? status?.test : status?.live;

  return (
    <div className="space-y-6">
      {/* Environment Toggle */}
      <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg w-fit">
        {(["test", "live"] as const).map((env) => (
          <button
            key={env}
            onClick={() => setEnvironment(env)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              environment === env
                ? env === "live" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {env === "test" ? "Sandbox" : "Live"}
            {(env === "test" ? status?.test : status?.live)?.configured && (
              <Check className="w-3 h-3 ml-1.5 inline" />
            )}
          </button>
        ))}
      </div>

      {/* Status Banner */}
      {currentEnvStatus?.configured && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400">
            Configured: {currentEnvStatus.client_id_prefix}...
          </span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-zinc-400">Client ID</label>
            <a
              href="https://developer.paypal.com/dashboard/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
            >
              Get credentials <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type={showSecrets ? "text" : "password"}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={`${environment === "live" ? "Live" : "Sandbox"} Client ID`}
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-zinc-400">Client Secret</label>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
            >
              {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showSecrets ? "Hide" : "Show"}
            </button>
          </div>
          <input
            type={showSecrets ? "text" : "password"}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Client Secret"
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-2 block">
            Webhook ID <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            type="text"
            value={webhookId}
            onChange={(e) => setWebhookId(e.target.value)}
            placeholder="Webhook ID for payment notifications"
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleValidate}
          disabled={validating || saving || !clientId || !clientSecret}
          className="flex-1 px-4 py-2.5 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {validating && <Loader2 className="w-4 h-4 animate-spin" />}
          {validating ? "Verifying..." : "Verify"}
        </button>
        <button
          onClick={handleSave}
          disabled={validating || saving || !clientId || !clientSecret}
          className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Credentials"}
        </button>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 mb-3">Configuration Status</p>
        <div className="grid grid-cols-2 gap-3">
          {(["test", "live"] as const).map((env) => {
            const envStatus = env === "test" ? status?.test : status?.live;
            return (
              <div key={env} className="flex items-center justify-between p-2.5 bg-zinc-900/50 rounded-lg">
                <span className="text-xs text-zinc-500 capitalize">{env === "test" ? "Sandbox" : "Live"}</span>
                <span className={`text-xs ${envStatus?.configured ? "text-emerald-400" : "text-zinc-600"}`}>
                  {envStatus?.configured ? "Ready" : "Not set"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
