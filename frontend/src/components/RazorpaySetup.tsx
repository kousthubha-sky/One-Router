// frontend/src/components/RazorpaySetup.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Shield, Zap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface RazorpayStatus {
  test: {
    configured: boolean;
    verified: boolean;
    key_prefix: string | null;
  };
  live: {
    configured: boolean;
    verified: boolean;
    key_prefix: string | null;
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

export function RazorpaySetup({ apiClient }: Props) {
  const { getToken } = useAuth();
  const [environment, setEnvironment] = useState<"test" | "live">("test");
  const [status, setStatus] = useState<RazorpayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<"validate" | "store" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  // Load status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/api/razorpay/status");
      setStatus(response as unknown as RazorpayStatus);
      setError(null);
    } catch (err) {
      setError("Failed to load Razorpay status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnvironmentKeyDown = (env: "test" | "live") => (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Activate on Enter or Space key
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

      // Validate key format first
      const expectedPrefix = environment === "live" ? "rzp_live_" : "rzp_test_";
      if (!keyId.startsWith(expectedPrefix)) {
        setError(
          `Invalid ${environment} key. Must start with '${expectedPrefix}'`
        );
        return;
      }

      const response = await apiClient("/api/razorpay/validate-credentials", {
        method: "POST",
        body: JSON.stringify({
          environment,
          key_id: keyId,
          key_secret: keySecret,
          webhook_secret: webhookSecret || null,
        }),
      });

      if (response.valid) {
        setSuccess(`${environment.toUpperCase()} credentials are valid!`);
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

      // Validate first
      const expectedPrefix = environment === "live" ? "rzp_live_" : "rzp_test_";
      if (!keyId.startsWith(expectedPrefix)) {
        setError(
          `Invalid ${environment} key. Must start with '${expectedPrefix}'`
        );
        return;
      }

      const response = await apiClient("/api/razorpay/credentials", {
        method: "POST",
        body: JSON.stringify({
          environment,
          key_id: keyId,
          key_secret: keySecret,
          webhook_secret: webhookSecret || null,
        }),
      });

      if (response.success) {
        setSuccess(
          `${environment.toUpperCase()} Razorpay credentials saved successfully!`
        );
        // Reset form
        setKeyId("");
        setKeySecret("");
        setWebhookSecret("");
        // Reload status
        await loadStatus();
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

  const currentEnvStatus = status?.[environment];
  const allConfigured =
    status?.test.configured && status?.live.configured;
  const allVerified =
    status?.test.verified && status?.live.verified;

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
              <h3 className="font-semibold text-white mb-2">Test Environment</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {status?.test.configured ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-gray-300">
                    {status?.test.configured
                      ? `Configured: ${status.test.key_prefix}`
                      : "Not configured"}
                  </span>
                </div>
                {status?.test.configured && (
                  <div className="flex items-center gap-2">
                    {status.test.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-gray-300">
                      {status.test.verified
                        ? "Webhook verified"
                        : "Webhook not verified"}
                    </span>
                  </div>
                )}
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
                      ? `Configured: ${status.live.key_prefix}`
                      : "Not configured"}
                  </span>
                </div>
                {status?.live.configured && (
                  <div className="flex items-center gap-2">
                    {status.live.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-gray-300">
                      {status.live.verified
                        ? "Webhook verified"
                        : "Webhook not verified"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Form */}
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Configure {environment.toUpperCase()} Razorpay Keys
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {environment === "live"
              ? "Enter your live Razorpay keys (rzp_live_*) for production transactions"
              : "Enter your test Razorpay keys (rzp_test_*) for sandbox testing"}
          </p>
        </div>

        {/* Key ID Input */}
        <div>
          <label htmlFor="razorpay-key-id" className="block text-sm font-medium text-gray-300 mb-2">
            Key ID {environment === "live" ? "(rzp_live_*)" : "(rzp_test_*)"}
          </label>
          <input
            id="razorpay-key-id"
            type="password"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder={`Enter your ${environment} Razorpay key ID`}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />
        </div>

        {/* Key Secret Input */}
        <div>
          <label htmlFor="razorpay-key-secret" className="block text-sm font-medium text-gray-300 mb-2">
            Key Secret
          </label>
          <input
            id="razorpay-key-secret"
            type="password"
            value={keySecret}
            onChange={(e) => setKeySecret(e.target.value)}
            placeholder="Enter your Razorpay key secret"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />
        </div>

        {/* Webhook Secret Input (Optional) */}
        <div>
          <label htmlFor="razorpay-webhook-secret" className="block text-sm font-medium text-gray-300 mb-2">
            Webhook Secret (Optional)
          </label>
          <input
            id="razorpay-webhook-secret"
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Enter webhook secret if configured"
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
            disabled={actionInProgress !== null || !keyId || !keySecret}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionInProgress === "validate" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Validating...
              </>
            ) : (
              "Validate Keys"
            )}
          </button>
          <button
            onClick={handleStore}
            disabled={actionInProgress !== null || !keyId || !keySecret}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionInProgress === "store" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Saving...
              </>
            ) : (
              "Save Keys"
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
              <span className="text-gray-400">Test Environment</span>
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
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Active Environment</span>
              <span className="text-cyan-400 font-semibold">
                {status.active_environment || "None"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
