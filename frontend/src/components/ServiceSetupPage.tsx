"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useClientApiCall } from "@/lib/api-client";
import { ArrowLeft, ExternalLink, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password";
  hint?: string;
  testPlaceholder?: string;
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
      // Status endpoint might not exist for all services
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

  const allFieldsFilled = config.fields.every(f => fields[f.key]?.trim());

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
        setSuccess("Credentials verified successfully");
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

      setSuccess(`${environment === "live" ? "Live" : "Test"} credentials saved`);
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
      <div className="min-h-screen bg-[#050505]">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/services"
              className="p-2 -ml-2 text-[#666] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 bg-[#111] rounded-lg flex items-center justify-center">
              <Image src={config.logo} alt={config.name} width={20} height={20} className="object-contain" />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-medium text-white">{config.name}</h1>
              <p className="text-xs text-[#666]">{config.description}</p>
            </div>
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#666] hover:text-white border border-[#222] hover:border-[#444] rounded-lg transition-colors"
            >
              {config.docsLabel}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Environment Toggle */}
          <div className="flex gap-1 p-1 bg-[#111] rounded-lg mb-6">
            <button
              onClick={() => setEnvironment("test")}
              className={`flex-1 px-4 py-2 text-xs font-medium rounded-md transition-all ${
                environment === "test"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666] hover:text-white"
              }`}
            >
              Test
              {status?.test?.configured && (
                <CheckCircle2 className="w-3 h-3 inline ml-1.5 text-emerald-500" />
              )}
            </button>
            <button
              onClick={() => setEnvironment("live")}
              className={`flex-1 px-4 py-2 text-xs font-medium rounded-md transition-all ${
                environment === "live"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666] hover:text-white"
              }`}
            >
              Live
              {status?.live?.configured && (
                <CheckCircle2 className="w-3 h-3 inline ml-1.5 text-emerald-500" />
              )}
            </button>
          </div>

          {/* Status Badge */}
          {!loading && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-6 ${
              isConfigured
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-[#111] border border-[#222]"
            }`}>
              {isConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-400">
                    {environment === "live" ? "Live" : "Test"} credentials configured
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[#666]" />
                  <span className="text-xs text-[#666]">
                    {environment === "live" ? "Live" : "Test"} credentials not set
                  </span>
                </>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-[#888] mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                    value={fields[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={environment === "test" && field.testPlaceholder ? field.testPlaceholder : field.placeholder}
                    className="w-full px-3 py-2.5 bg-[#111] border border-[#222] rounded-lg text-sm text-white placeholder-[#444] font-mono focus:outline-none focus:border-[#444] transition-colors"
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={() => toggleShowSecret(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
                    >
                      {showSecrets[field.key] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {field.hint && (
                  <p className="text-[10px] text-[#555] mt-1.5">{field.hint}</p>
                )}
              </div>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleValidate}
              disabled={!allFieldsFilled || validating || saving}
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#222] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {validating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
              ) : (
                "Verify"
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={!allFieldsFilled || validating || saving}
              className="flex-1 px-4 py-2.5 bg-white text-black text-xs font-medium rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
              ) : (
                "Save"
              )}
            </button>
          </div>

          {/* Help text */}
          <p className="text-[10px] text-[#444] text-center mt-4">
            Credentials are encrypted and stored securely
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
          <div className="flex items-center justify-center min-h-screen bg-[#050505]">
            <Loader2 className="w-5 h-5 animate-spin text-[#666]" />
          </div>
        </DashboardLayout>
      }
    >
      <ServiceSetupContent config={config} />
    </Suspense>
  );
}
