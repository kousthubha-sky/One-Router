// frontend/src/components/GlobalEnvironmentToggle.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/nextjs";


import { Loader2, Zap, Shield } from "lucide-react";

interface Service {
  id: string;
  service_name: string;
  environment: string;
  active_environment?: string;  // Per-service environment setting (takes precedence)
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

export function GlobalEnvironmentToggle({ services, onGlobalSwitch, apiClient }: GlobalEnvironmentToggleProps) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentMode, setCurrentMode] = useState<"test" | "live" | "mixed">("test");
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [missingLiveServices, setMissingLiveServices] = useState<string[]>([]);
  const [servicesWithLive, setServicesWithLive] = useState<string[]>([]);
  const { getToken } = useAuth();

  // apiClient is required for environment switching




    // Determine current global mode based on active_environment (per-service setting)
    useEffect(() => {
      if (services.length === 0) {
        setCurrentMode("test");
        return;
      }

      // Use active_environment if available (per-service setting), otherwise fall back to environment
      const environments = services.map(s => s.active_environment || s.environment);
      const uniqueEnvs = [...new Set(environments)];

      if (uniqueEnvs.length === 1) {
        const mode = uniqueEnvs[0] as "test" | "live";
        setCurrentMode(mode);
      } else {
        setCurrentMode("mixed");
      }
    }, [services]);

  const switchAllServices = async (targetEnvironment: "test" | "live") => {
    const previousMode = currentMode;
    // Don't block switching based on displayed services - user can switch env preference anytime
    
    // Require apiClient for switching environments
    if (!apiClient) {
      alert("Configuration error: Unable to switch environments. Please refresh the page.");
      return;
    }
    
    // If switching to live, check if live credentials are configured for ALL services
    if (targetEnvironment === "live") {
      try {
        const response = await apiClient("/api/services/can-go-live") as unknown as CanGoLiveResponse;
        if (!response.can_go_live) {
          // Store which services are missing live credentials and which have them
          setMissingLiveServices(response.services_missing_live || []);
          setServicesWithLive(response.services_with_live || []);
          setShowLiveModal(true);
          return;
        }
      } catch {
        // If check fails, show modal to be safe
        setMissingLiveServices([]);
        setServicesWithLive([]);
        setShowLiveModal(true);
        return;
      }
    }
    
    // Get Clerk token for authentication
    const token = await getToken();
    if (!token) {
      alert('Authentication failed. Please log in again.');
      return;
    }
    
    setIsSwitching(true);
    
    try {
      // Don't pass service_ids - let backend switch ALL services atomically
      // This ensures all environments get updated, not just currently displayed ones
      await apiClient("/api/services/switch-all-environments", {
        method: "POST",
        body: JSON.stringify({
          environment: targetEnvironment
        })
      });

      // Only update UI AFTER successful API response
      setCurrentMode(targetEnvironment);
      onGlobalSwitch?.(targetEnvironment);

    } catch (error) {
       // Restore previous mode on error (UI never changed, so this is just for safety)
      setCurrentMode(previousMode);
      
      // Show user-friendly error message
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to switch environment: ${errorMsg}\n\nPlease try again.`);
    } finally {
      setIsSwitching(false);
    }
  };

  // Partial switch - only switch services that have credentials for target environment
  const partialSwitchToLive = async () => {
    if (!apiClient) {
      alert("Configuration error: Unable to switch environments. Please refresh the page.");
      return;
    }

    const token = await getToken();
    if (!token) {
      alert('Authentication failed. Please log in again.');
      return;
    }

    setIsSwitching(true);
    setShowLiveModal(false);

    try {
      const response = await apiClient("/api/services/switch-all-environments", {
        method: "POST",
        body: JSON.stringify({
          environment: "live",
          partial_switch: true
        })
      }) as unknown as SwitchResponse;

      // Update to mixed mode since some services will be in different environments
      if (response.skipped_services && response.skipped_services.length > 0) {
        setCurrentMode("mixed");
      } else {
        setCurrentMode("live");
      }
      onGlobalSwitch?.("live");

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to switch environment: ${errorMsg}\n\nPlease try again.`);
    } finally {
      setIsSwitching(false);
    }
  };



  // Always show the toggle for environment switching, even if no services are configured yet
  // This allows users to switch between test/live modes
  
  const isLiveMode = currentMode === "live";
  const isMixedMode = currentMode === "mixed";

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Mixed mode indicator */}
        {isMixedMode && (
          <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
            Mixed
          </div>
        )}
        
        <div className={`flex items-center bg-[#1a1a1a] rounded-full border p-1 ${
          isMixedMode ? 'border-yellow-500/50' : 'border-[#333]'
        }`}>
          <button
            onClick={() => !isSwitching && switchAllServices("test")}
            disabled={isSwitching || !apiClient}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
              currentMode === "test"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : isMixedMode
                  ? "text-blue-400 hover:text-white hover:bg-[#333]"
                  : "text-[#888] hover:text-white hover:bg-[#333]"
            } ${(isSwitching || !apiClient) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSwitching && currentMode === "test" && <Loader2 className="w-3 h-3 mr-1 inline animate-spin" />}
            <Zap className="w-3 h-3 mr-1 inline" />
            Test
            {currentMode === "test" && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
          </button>

          <button
            onClick={() => !isSwitching && switchAllServices("live")}
            disabled={isSwitching || !apiClient}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
              isLiveMode
                ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                : isMixedMode
                  ? "text-green-400 hover:text-white hover:bg-[#333]"
                  : "text-[#888] hover:text-white hover:bg-[#333]"
            } ${(isSwitching || !apiClient) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSwitching && isLiveMode && <Loader2 className="w-3 h-3 mr-1 inline animate-spin" />}
            <Shield className="w-3 h-3 mr-1 inline" />
            Live
            {isLiveMode && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
      </div>

    {/* Modal: Configure Live Keys First - rendered via Portal to escape stacking context */}
    {showLiveModal && typeof document !== 'undefined' && createPortal(
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center" style={{ zIndex: 99999 }}>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg mx-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-semibold text-white">Switch to Live Mode</h2>
          </div>

          {/* Services with live credentials */}
          {servicesWithLive.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Ready for live mode:</p>
              <div className="flex flex-wrap gap-2">
                {servicesWithLive.map((service) => (
                  <span key={service} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm capitalize border border-green-500/30">
                    ✓ {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services missing live credentials */}
          {missingLiveServices.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Missing live credentials:</p>
              <ul className="space-y-2">
                {missingLiveServices.map((service) => {
                  const setupRoutes: Record<string, string> = {
                    razorpay: '/razorpay-setup',
                    paypal: '/paypal-setup',
                    twilio: '/onboarding',
                  };
                  const setupRoute = setupRoutes[service.toLowerCase()] || '/onboarding';

                  return (
                    <li key={service} className="flex items-center justify-between bg-yellow-500/10 px-3 py-2 rounded border border-yellow-500/20">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        <span className="capitalize">{service}</span>
                        <span className="text-xs text-gray-500">(will stay in test mode)</span>
                      </div>
                      <a
                        href={`${setupRoute}?environment=live`}
                        className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Configure
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Info box about per-service switching */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-300">
              <strong>Tip:</strong> You can switch individual services to live/test mode independently from the Services page.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowLiveModal(false)}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            {servicesWithLive.length > 0 && (
              <button
                onClick={partialSwitchToLive}
                disabled={isSwitching}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSwitching ? (
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                ) : null}
                Switch Available ({servicesWithLive.length})
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
