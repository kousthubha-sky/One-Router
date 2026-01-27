// frontend/src/components/PayPalSetup.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Zap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PayPalStatus {
  test: {
    configured: boolean;
    client_id_prefix: string | null;
  };
  live: {
    configured: boolean;
    client_id_prefix: string | null;
  };
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
  const initialEnv = searchParams.get("environment") === "live" ? "live" : "test";

  const [environment, setEnvironment] = useState<"test" | "live">(initialEnv);
  const [status, setStatus] = useState<PayPalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<"validate" | "store" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookId, setWebhookId] = useState("");
  const router = useRouter();

  // Load status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/api/paypal/status");
      setStatus(response as unknown as PayPalStatus);
      setError(null);
    } catch (err) {
      // If status endpoint fails, just show empty state
      setStatus({
        test: { configured: false, client_id_prefix: null },
        live: { configured: false, client_id_prefix: null },
        active_environment: "test"
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnvironmentKeyDown = (env: "test" | "live") => (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setEnvironment(env);
    }
  };

  const handleValidate = async () => {
    try {
      setActionInProgress("validate");
      setError(null);
      setSuccess(null);

      const response = await apiClient("/api/paypal/validate-credentials", {
        method: "POST",
        body: JSON.stringify({
          environment,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (response.valid) {
        setSuccess(`${environment.toUpperCase()} PayPal credentials are valid!`);
      } else {
        setError("Credentials validation failed");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Validation failed";
      setError(errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStore = async () => {
    try {
      setActionInProgress("store");
      setError(null);
      setSuccess(null);

      const payload = {
        environment,
        client_id: clientId,
        client_secret: clientSecret,
        webhook_id: webhookId && webhookId.trim() !== "" ? webhookId : null,
      };

      console.log("Sending PayPal credentials payload:", payload);

      const response = await apiClient("/api/paypal/credentials", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("PayPal credentials response:", response);

      if (response.success) {
        setSuccess(
          `${environment.toUpperCase()} PayPal credentials saved successfully!`
        );
        // Reset form
        setClientId("");
        setClientSecret("");
        setWebhookId("");
        // Reload status
        await loadStatus();

        // Redirect back to services after short delay to show success message
        setTimeout(() => {
          router.push("/services");
        }, 1500);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to store credentials";
      setError(errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Environment Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test Environment Card */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={environment === "test"}
          onKeyDown={handleEnvironmentKeyDown("test")}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            environment === "test"
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-gray-700 bg-gray-900/50"
          }`}
          onClick={() => setEnvironment("test")}
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-cyan-500 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Sandbox Environment</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {status?.test.configured ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-gray-300">
                    {status?.test.configured
                      ? `Configured: ${status.test.client_id_prefix}...`
                      : "Not configured"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Environment Card */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={environment === "live"}
          onKeyDown={handleEnvironmentKeyDown("live")}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            environment === "live"
              ? "border-green-500 bg-green-500/10"
              : "border-gray-700 bg-gray-900/50"
          }`}
          onClick={() => setEnvironment("live")}
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-500 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Live Environment</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {status?.live.configured ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-gray-300">
                    {status?.live.configured
                      ? `Configured: ${status.live.client_id_prefix}...`
                      : "Not configured"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Form */}
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Configure {environment === "live" ? "Live" : "Sandbox"} PayPal Credentials
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {environment === "live"
              ? "Enter your live PayPal API credentials for production transactions"
              : "Enter your sandbox PayPal API credentials for testing"}
          </p>
        </div>

        {/* Client ID Input */}
        <div>
          <label htmlFor="paypal-client-id" className="block text-sm font-medium text-gray-300 mb-2">
            Client ID
          </label>
          <input
            id="paypal-client-id"
            type="password"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={`Enter your ${environment === "live" ? "live" : "sandbox"} PayPal Client ID`}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />
        </div>

        {/* Client Secret Input */}
        <div>
          <label htmlFor="paypal-client-secret" className="block text-sm font-medium text-gray-300 mb-2">
            Client Secret
          </label>
          <input
            id="paypal-client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Enter your PayPal Client Secret"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />
        </div>

        {/* Webhook ID Input (Optional) */}
        <div>
          <label htmlFor="paypal-webhook-id" className="block text-sm font-medium text-gray-300 mb-2">
            Webhook ID (Optional)
          </label>
          <input
            id="paypal-webhook-id"
            type="text"
            value={webhookId}
            onChange={(e) => setWebhookId(e.target.value)}
            placeholder="Enter webhook ID if configured"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleValidate}
            disabled={actionInProgress !== null || !clientId || !clientSecret}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionInProgress === "validate" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Validating...
              </>
            ) : (
              "Validate Credentials"
            )}
          </button>
          <button
            onClick={handleStore}
            disabled={actionInProgress !== null || !clientId || !clientSecret}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionInProgress === "store" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Saving...
              </>
            ) : (
              "Save Credentials"
            )}
          </button>
        </div>
      </div>

      {/* Summary */}
      {status && (
        <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
          <h4 className="font-semibold text-white mb-3">Configuration Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Sandbox Environment</span>
              <span className={status.test.configured ? "text-green-400" : "text-gray-400"}>
                {status.test.configured ? "✓ Ready" : "○ Not Set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Live Environment</span>
              <span className={status.live.configured ? "text-green-400" : "text-gray-400"}>
                {status.live.configured ? "✓ Ready" : "○ Not Set"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
