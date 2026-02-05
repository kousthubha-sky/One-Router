"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Zap, Shield, ArrowRight, Check, X } from "lucide-react";

interface Service {
  id: string;
  service_name: string;
  environment: string;
  active_environment?: string;
}

interface RequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

interface CanGoLiveResponse {
  can_go_live: boolean;
  services_with_test: string[];
  services_with_live: string[];
  services_missing_live: string[];
  message: string;
}

interface SwitchResponse {
  status: string;
  environment: string;
  message: string;
  partial_switch?: boolean;
  switched_services?: string[];
  skipped_services?: string[];
}

interface GlobalEnvironmentToggleProps {
  services: Service[];
  onGlobalSwitch?: (newEnvironment: "test" | "live") => void;
  apiClient?: (url: string, options?: RequestOptions) => Promise<Record<string, unknown>>;
}

const SERVICE_ICONS: Record<string, string> = {
  razorpay: "https://razorpay.com/favicon.ico",
  paypal: "https://www.paypalobjects.com/webstatic/icon/pp258.png",
  twilio: "https://www.twilio.com/favicon.ico",
  resend: "https://resend.com/favicon.ico",
};

const STORAGE_KEY = "onerouter_environment_mode";

export function GlobalEnvironmentToggle({ services, onGlobalSwitch, apiClient }: GlobalEnvironmentToggleProps) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentMode, setCurrentMode] = useState<"test" | "live" | "mixed">("test");
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [missingLiveServices, setMissingLiveServices] = useState<string[]>([]);
  const [servicesWithLive, setServicesWithLive] = useState<string[]>([]);
  const { getToken } = useAuth();

  // Load saved preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "test" || saved === "live") {
      setCurrentMode(saved);
    }
  }, []);

  // Derive mode from services, but prefer localStorage if set
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY);

    // If user has explicitly set a preference, use that
    if (savedMode === "test" || savedMode === "live") {
      setCurrentMode(savedMode);
      return;
    }

    // Otherwise derive from services
    if (services.length === 0) {
      setCurrentMode("test");
      return;
    }

    const environments = services.map(s => s.active_environment || s.environment);
    const uniqueEnvs = [...new Set(environments)];

    if (uniqueEnvs.length === 1) {
      setCurrentMode(uniqueEnvs[0] as "test" | "live");
    } else {
      setCurrentMode("mixed");
    }
  }, [services]);

  const switchAllServices = async (targetEnvironment: "test" | "live") => {
    const previousMode = currentMode;

    if (!apiClient) {
      alert("Configuration error: Unable to switch environments.");
      return;
    }

    if (targetEnvironment === "live") {
      try {
        const response = await apiClient("/api/services/can-go-live") as unknown as CanGoLiveResponse;
        if (!response.can_go_live) {
          setMissingLiveServices(response.services_missing_live || []);
          setServicesWithLive(response.services_with_live || []);
          setShowLiveModal(true);
          return;
        }
      } catch {
        setMissingLiveServices([]);
        setServicesWithLive([]);
        setShowLiveModal(true);
        return;
      }
    }

    const token = await getToken();
    if (!token) {
      alert('Authentication failed. Please log in again.');
      return;
    }

    setIsSwitching(true);

    try {
      await apiClient("/api/services/switch-all-environments", {
        method: "POST",
        body: JSON.stringify({ environment: targetEnvironment })
      });

      setCurrentMode(targetEnvironment);
      localStorage.setItem(STORAGE_KEY, targetEnvironment);
      onGlobalSwitch?.(targetEnvironment);

    } catch (error) {
      setCurrentMode(previousMode);
      alert(`Failed to switch: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSwitching(false);
    }
  };

  const partialSwitchToLive = async () => {
    if (!apiClient) return;

    const token = await getToken();
    if (!token) {
      alert('Authentication failed.');
      return;
    }

    setIsSwitching(true);
    setShowLiveModal(false);

    try {
      const response = await apiClient("/api/services/switch-all-environments", {
        method: "POST",
        body: JSON.stringify({ environment: "live", partial_switch: true })
      }) as unknown as SwitchResponse;

      const newMode = response.skipped_services?.length ? "mixed" : "live";
      setCurrentMode(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);
      onGlobalSwitch?.("live");
    } catch (error) {
      alert(`Failed to switch: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentMode === "mixed" && (
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Mixed</span>
        )}

        <div className="flex p-0.5 bg-zinc-900 rounded-lg">
          <button
            onClick={() => !isSwitching && switchAllServices("test")}
            disabled={isSwitching || !apiClient}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentMode === "test"
                ? "bg-blue-500/15 text-blue-400"
                : "text-zinc-500 hover:text-zinc-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Zap className="w-3 h-3" />
            Test
          </button>

          <button
            onClick={() => !isSwitching && switchAllServices("live")}
            disabled={isSwitching || !apiClient}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentMode === "live"
                ? "bg-emerald-500/15 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Shield className="w-3 h-3" />
            Live
          </button>
        </div>

        {isSwitching && <Loader2 className="w-3 h-3 animate-spin text-zinc-600" />}
      </div>

      {/* Modal */}
      {showLiveModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowLiveModal(false)}
        >
          <div
            className="bg-[#0f0f0f] border border-zinc-800 rounded-xl max-w-sm mx-4 w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium">Switch to Live</span>
              </div>
              <button
                onClick={() => setShowLiveModal(false)}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Ready Services */}
              {servicesWithLive.length > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Ready for live</p>
                  <div className="flex flex-wrap gap-1.5">
                    {servicesWithLive.map((service) => (
                      <div
                        key={service}
                        className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400"
                      >
                        <img
                          src={SERVICE_ICONS[service.toLowerCase()] || `https://ui-avatars.com/api/?name=${service}&background=18181b&color=fff&size=16`}
                          alt={service}
                          className="w-3.5 h-3.5 rounded"
                        />
                        <span className="capitalize">{service}</span>
                        <Check className="w-3 h-3" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Services */}
              {missingLiveServices.length > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Missing credentials</p>
                  <div className="space-y-2">
                    {missingLiveServices.map((service) => {
                      const setupRoutes: Record<string, string> = {
                        razorpay: '/razorpay-setup',
                        paypal: '/paypal-setup',
                        twilio: '/twilio-setup',
                        resend: '/resend-setup',
                      };
                      const setupRoute = setupRoutes[service.toLowerCase()] || '/onboarding';

                      return (
                        <div
                          key={service}
                          className="flex items-center justify-between p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={SERVICE_ICONS[service.toLowerCase()] || `https://ui-avatars.com/api/?name=${service}&background=18181b&color=fff&size=20`}
                              alt={service}
                              className="w-5 h-5 rounded"
                            />
                            <div>
                              <p className="text-xs font-medium capitalize">{service}</p>
                              <p className="text-[10px] text-zinc-600">Will stay in test</p>
                            </div>
                          </div>
                          <a
                            href={`${setupRoute}?environment=live`}
                            className="flex items-center gap-1 px-2 py-1 bg-white text-black text-[10px] font-medium rounded hover:bg-zinc-200 transition-colors"
                          >
                            Setup <ArrowRight className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-zinc-800 bg-zinc-900/30">
              <button
                onClick={() => setShowLiveModal(false)}
                className="flex-1 px-3 py-2 text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {servicesWithLive.length > 0 && (
                <button
                  onClick={partialSwitchToLive}
                  disabled={isSwitching}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {isSwitching ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>Switch {servicesWithLive.length}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
