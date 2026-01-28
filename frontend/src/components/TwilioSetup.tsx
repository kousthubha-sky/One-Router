// frontend/src/components/TwilioSetup.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Shield, Zap, CheckCircle2, AlertCircle, Loader2, MessageSquare } from "lucide-react";

interface TwilioStatus {
  test: {
    configured: boolean;
    sid_prefix: string | null;
    from_number: string | null;
  };
  live: {
    configured: boolean;
    sid_prefix: string | null;
    from_number: string | null;
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

export function TwilioSetup({ apiClient }: Props) {
  const { getToken } = useAuth();
  const [environment, setEnvironment] = useState<"test" | "live">("test");
  const [status, setStatus] = useState<TwilioStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<"validate" | "store" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const router = useRouter();

  // Load status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/api/twilio/status");
      setStatus(response as unknown as TwilioStatus);
      setError(null);
    } catch (err) {
      setError("Failed to load Twilio status");
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

      // Validate Account SID format
      if (!accountSid.startsWith("AC")) {
        setError("Account SID must start with 'AC'");
        return;
      }

      // Validate phone number format
      if (!fromNumber.startsWith("+")) {
        setError("From number must be in E.164 format (e.g., +15005550006)");
        return;
      }

      const response = await apiClient("/api/twilio/validate-credentials", {
        method: "POST",
        body: JSON.stringify({
          environment,
          account_sid: accountSid,
          auth_token: authToken,
          from_number: fromNumber,
        }),
      });

      if (response.valid) {
        const accountName = response.account_name ? ` (${response.account_name})` : "";
        setSuccess(`${environment.toUpperCase()} credentials are valid!${accountName}`);
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

      // Validate Account SID format
      if (!accountSid.startsWith("AC")) {
        setError("Account SID must start with 'AC'");
        return;
      }

      // Validate phone number format
      if (!fromNumber.startsWith("+")) {
        setError("From number must be in E.164 format (e.g., +15005550006)");
        return;
      }

      const payload = {
        environment,
        account_sid: accountSid,
        auth_token: authToken,
        from_number: fromNumber,
      };

      const response = await apiClient("/api/twilio/credentials", {
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
          `${environment.toUpperCase()} Twilio credentials saved successfully!`
        );
        // Reset form
        setAccountSid("");
        setAuthToken("");
        setFromNumber("");
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
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-300">About Twilio Credentials</h4>
            <p className="text-sm text-blue-200/70 mt-1">
              Twilio provides separate Test and Live credentials. Test credentials use magic numbers
              like <code className="bg-blue-900/50 px-1 rounded">+15005550006</code> and don&apos;t incur charges.
              Find your credentials in the{" "}
              <a
                href="https://console.twilio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Twilio Console
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
                      ? `SID: ${status.test.sid_prefix}`
                      : "Not configured"}
                  </span>
                </div>
                {status?.test.configured && status.test.from_number && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-300">
                      From: {status.test.from_number}
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
                      ? `SID: ${status.live.sid_prefix}`
                      : "Not configured"}
                  </span>
                </div>
                {status?.live.configured && status.live.from_number && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">
                      From: {status.live.from_number}
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
            Configure {environment.toUpperCase()} Twilio Credentials
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {environment === "live"
              ? "Enter your live Twilio credentials for production SMS"
              : "Enter your test Twilio credentials for sandbox testing (use magic number +15005550006)"}
          </p>
        </div>

        {/* Account SID Input */}
        <div>
          <label htmlFor="twilio-account-sid" className="block text-sm font-medium text-gray-300 mb-2">
            Account SID (starts with AC)
          </label>
          <input
            id="twilio-account-sid"
            type="text"
            value={accountSid}
            onChange={(e) => setAccountSid(e.target.value)}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 font-mono"
          />
        </div>

        {/* Auth Token Input */}
        <div>
          <label htmlFor="twilio-auth-token" className="block text-sm font-medium text-gray-300 mb-2">
            Auth Token
          </label>
          <input
            id="twilio-auth-token"
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Enter your Twilio auth token"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />
        </div>

        {/* From Number Input */}
        <div>
          <label htmlFor="twilio-from-number" className="block text-sm font-medium text-gray-300 mb-2">
            From Phone Number (E.164 format)
          </label>
          <input
            id="twilio-from-number"
            type="text"
            value={fromNumber}
            onChange={(e) => setFromNumber(e.target.value)}
            placeholder={environment === "test" ? "+15005550006 (magic number)" : "+1234567890"}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">
            {environment === "test"
              ? "Use Twilio magic number +15005550006 for testing"
              : "Your Twilio phone number for sending SMS"}
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
            disabled={actionInProgress !== null || !accountSid || !authToken || !fromNumber}
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
            disabled={actionInProgress !== null || !accountSid || !authToken || !fromNumber}
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
