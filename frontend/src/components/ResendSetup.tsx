// frontend/src/components/ResendSetup.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Shield, Zap, CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";

interface ResendStatus {
  test: {
    configured: boolean;
    api_key_prefix: string | null;
    from_email: string | null;
  };
  live: {
    configured: boolean;
    api_key_prefix: string | null;
    from_email: string | null;
  };
  active_environment: string | null;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string;
  headers?: Record<string, string>;
}

interface Props {
  apiClient: (url: string, options?: RequestOptions) => Promise<Record<string, unknown>>;
}

export function ResendSetup({ apiClient }: Props) {
  const { getToken } = useAuth();
  const [environment, setEnvironment] = useState<"test" | "live">("test");
  const [status, setStatus] = useState<ResendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<"validate" | "store" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const router = useRouter();

  // Load status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/api/resend/status");
      setStatus(response as unknown as ResendStatus);
      setError(null);
    } catch (err) {
      setError("Failed to load Resend status");
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

      // Validate API key format
      if (!apiKey.startsWith("re_")) {
        setError("API key must start with 're_'");
        return;
      }

      // Validate email format
      if (!fromEmail.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      const response = await apiClient("/api/resend/validate-credentials", {
        method: "POST",
        body: JSON.stringify({
          environment,
          api_key: apiKey,
          from_email: fromEmail,
        }),
      });

      if (response.valid) {
        const domainInfo = response.domain_count ? ` (${response.domain_count} domains configured)` : "";
        setSuccess(`${environment.toUpperCase()} credentials are valid!${domainInfo}`);
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

      // Validate API key format
      if (!apiKey.startsWith("re_")) {
        setError("API key must start with 're_'");
        return;
      }

      // Validate email format
      if (!fromEmail.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      const payload = {
        environment,
        api_key: apiKey,
        from_email: fromEmail,
      };

      const response = await apiClient("/api/resend/credentials", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Check for error in response
      if (response.error || response.detail) {
        const errMsg = (response.error || response.detail) as string;
        setError(errMsg);
        return;
      }

      if (response.success) {
        setSuccess(
          `${environment.toUpperCase()} Resend credentials saved successfully!`
        );
        // Reset form
        setApiKey("");
        setFromEmail("");
        // Reload status
        await loadStatus();

        // Redirect back to services after short delay
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
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 bg-pink-900/20 border border-pink-700/50 rounded-lg">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-pink-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-pink-300">About Resend Credentials</h4>
            <p className="text-sm text-pink-200/70 mt-1">
              Resend uses API keys that start with <code className="bg-pink-900/50 px-1 rounded">re_</code>.
              You can use test mode with unverified domains (emails only sent to your account).
              Find your API key in the{" "}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:underline"
              >
                Resend Dashboard
              </a>.
            </p>
          </div>
        </div>
      </div>

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
              ? "border-pink-500 bg-pink-500/10"
              : "border-gray-700 bg-gray-900/50"
          }`}
          onClick={() => setEnvironment("test")}
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-pink-500 mt-1" />
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
                      ? `Key: ${status.test.api_key_prefix}`
                      : "Not configured"}
                  </span>
                </div>
                {status?.test.configured && status.test.from_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-pink-400" />
                    <span className="text-gray-300">
                      From: {status.test.from_email}
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
                      ? `Key: ${status.live.api_key_prefix}`
                      : "Not configured"}
                  </span>
                </div>
                {status?.live.configured && status.live.from_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">
                      From: {status.live.from_email}
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
            Configure {environment.toUpperCase()} Resend Credentials
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {environment === "live"
              ? "Enter your live Resend credentials for production email"
              : "Enter your test Resend credentials (unverified domains only send to your account)"}
          </p>
        </div>

        {/* API Key Input */}
        <div>
          <label htmlFor="resend-api-key" className="block text-sm font-medium text-gray-300 mb-2">
            API Key (starts with re_)
          </label>
          <input
            id="resend-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 font-mono"
          />
        </div>

        {/* From Email Input */}
        <div>
          <label htmlFor="resend-from-email" className="block text-sm font-medium text-gray-300 mb-2">
            From Email Address
          </label>
          <input
            id="resend-from-email"
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder={environment === "test" ? "onboarding@resend.dev" : "hello@yourdomain.com"}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {environment === "test"
              ? "Use onboarding@resend.dev for testing or your verified domain"
              : "Must be from a verified domain in your Resend account"}
          </p>
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
            disabled={actionInProgress !== null || !apiKey || !fromEmail}
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
            disabled={actionInProgress !== null || !apiKey || !fromEmail}
            className="flex-1 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <span className="text-gray-400">Test Environment</span>
              <span className={status.test.configured ? "text-green-400" : "text-gray-400"}>
                {status.test.configured ? "Ready" : "Not Set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Live Environment</span>
              <span className={status.live.configured ? "text-green-400" : "text-gray-400"}>
                {status.live.configured ? "Ready" : "Not Set"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Active Environment</span>
              <span className="text-pink-400 font-semibold">
                {status.active_environment || "None"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
