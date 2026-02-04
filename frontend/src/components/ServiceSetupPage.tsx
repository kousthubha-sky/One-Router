"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useClientApiCall } from "@/lib/api-client";
import { ArrowLeft, ExternalLink, Loader2, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password";
  hint?: string;
  testPlaceholder?: string;
  optional?: boolean;
}

interface ServiceConfig {
  name: string;
  logo: string;
  description: string;
  docsUrl: string;
  docsLabel: string;
  fields: CredentialField[];
  validateEndpoint: string;
  storeEndpoint: string;
  statusEndpoint: string;
  validatePayload: (fields: Record<string, string>, environment: string) => Record<string, unknown>;
  storePayload: (fields: Record<string, string>, environment: string) => Record<string, unknown>;
}

interface ServiceSetupPageProps {
  config: ServiceConfig;
}

interface StatusResponse {
  test?: { configured: boolean };
  live?: { configured: boolean };
  active_environment?: string;
}

function ServiceSetupContent({ config }: ServiceSetupPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const apiClient = useClientApiCall();

  const initialEnv = searchParams.get("environment") === "live" ? "live" : "test";
  const [environment, setEnvironment] = useState<"test" | "live">(initialEnv);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await apiClient(config.statusEndpoint);
      setStatus(response as StatusResponse);
    } catch {
      // Status endpoint might not exist
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const requiredFields = config.fields.filter(f => !f.optional);
  const allFieldsFilled = requiredFields.every(f => fields[f.key]?.trim());

  const handleValidate = async () => {
    if (!allFieldsFilled) return;
    setValidating(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = config.validatePayload(fields, environment);
      const response = await apiClient(config.validateEndpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.valid) {
        setSuccess("Credentials verified");
      } else {
        setError((response.message as string) || "Invalid credentials");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!allFieldsFilled) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = config.storePayload(fields, environment);
      const response = await apiClient(config.storeEndpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.error || response.detail) {
        setError((response.error || response.detail) as string);
        return;
      }

      setSuccess("Credentials saved");
      setFields({});
      await loadStatus();
      setTimeout(() => router.push("/services"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = environment === "test" ? status?.test?.configured : status?.live?.configured;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#09090b]">
        {/* Compact Header */}
        <div className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
            <Link
              href="/services"
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Services</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src={config.logo} alt={config.name} className="w-5 h-5 rounded" />
              <span className="text-sm font-medium">{config.name}</span>
            </div>
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
            >
              Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Environment Toggle */}
          <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg mb-5 w-fit">
            {(["test", "live"] as const).map((env) => {
              const envConfigured = env === "test" ? status?.test?.configured : status?.live?.configured;
              return (
                <button
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    environment === env
                      ? env === "live"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-blue-500/15 text-blue-400"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  {env === "test" ? "Test" : "Live"}
                  {envConfigured && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Status */}
          {!loading && isConfigured && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-5 text-xs text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              {environment === "live" ? "Live" : "Test"} credentials configured
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.key}>
                <label className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span>
                    {field.label}
                    {field.optional && <span className="text-zinc-700 ml-1">(optional)</span>}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                    value={fields[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={environment === "test" && field.testPlaceholder ? field.testPlaceholder : field.placeholder}
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={() => toggleShowSecret(field.key)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {showSecrets[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                {field.hint && <p className="text-[10px] text-zinc-600 mt-1">{field.hint}</p>}
              </div>
            ))}
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

          {/* Actions */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={handleValidate}
              disabled={!allFieldsFilled || validating || saving}
              className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {validating ? "Verifying..." : "Verify"}
            </button>
            <button
              onClick={handleSave}
              disabled={!allFieldsFilled || validating || saving}
              className="flex-1 px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <p className="text-[10px] text-zinc-700 text-center mt-4">
            Credentials are encrypted with AES-256
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function ServiceSetupPage({ config }: ServiceSetupPageProps) {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
          </div>
        </DashboardLayout>
      }
    >
      <ServiceSetupContent config={config} />
    </Suspense>
  );
}
