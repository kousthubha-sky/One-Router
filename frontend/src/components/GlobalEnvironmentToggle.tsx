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
  const { getToken } = useAuth();

  // Warn if apiClient is missing
  useEffect(() => {
    if (!apiClient) {
      console.warn('GlobalEnvironmentToggle: apiClient prop is missing. Environment switching will not work.');
    }
  }, [apiClient]);




    // Determine current global mode
    useEffect(() => {
      if (services.length === 0) {
        setCurrentMode("test");
        return;
      }

      const environments = services.map(s => s.environment);
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
      console.error("apiClient is required to switch environments");
      alert("Configuration error: Unable to switch environments. Please refresh the page.");
      return;
    }
    
    // If switching to live, check if live credentials are configured for ALL services
    if (targetEnvironment === "live") {
      try {
        const response = await apiClient("/api/services/can-go-live") as unknown as CanGoLiveResponse;
        if (!response.can_go_live) {
          // Store which services are missing live credentials
          setMissingLiveServices(response.services_missing_live || []);
          setShowLiveModal(true);
          return;
        }
      } catch (error) {
        console.error("Failed to check live credentials:", error);
        // If check fails, show modal to be safe
        setMissingLiveServices([]);
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
      console.log('Atomically switching all services to:', targetEnvironment);

      // Don't pass service_ids - let backend switch ALL services atomically
      // This ensures all environments get updated, not just currently displayed ones
      const response = await apiClient("/api/services/switch-all-environments", {
        method: "POST",
        body: JSON.stringify({
          environment: targetEnvironment
        })
      });
      
      console.log('Switch response:', response);
      
      // Only update UI AFTER successful API response
      setCurrentMode(targetEnvironment);
      onGlobalSwitch?.(targetEnvironment);
      console.log('All services switched successfully');

    } catch (error) {
      console.error("Failed to switch all services:", error);
       // Restore previous mode on error (UI never changed, so this is just for safety)
      setCurrentMode(previousMode);
      
      // Show user-friendly error message
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to switch environment: ${errorMsg}\n\nPlease try again.`);
    } finally {
      setIsSwitching(false);
    }
  };



  // Always show the toggle for environment switching, even if no services are configured yet
  // This allows users to switch between test/live modes
  
  const isLiveMode = currentMode === "live";

  return (
    <>
      <div className="flex items-center bg-[#1a1a1a] rounded-full border border-[#333] p-1">
      <button
        onClick={() => !isSwitching && switchAllServices("test")}
        disabled={isSwitching || !apiClient}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
          !isLiveMode
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
            : "text-[#888] hover:text-white hover:bg-[#333]"
        } ${(isSwitching || !apiClient) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {isSwitching && !isLiveMode && <Loader2 className="w-3 h-3 mr-1 inline animate-spin" />}
        <Zap className="w-3 h-3 mr-1 inline" />
        Test
        {!isLiveMode && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        )}
      </button>

      <button
        onClick={() => !isSwitching && switchAllServices("live")}
        disabled={isSwitching || !apiClient}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
          isLiveMode
            ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
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

    {/* Modal: Configure Live Keys First - rendered via Portal to escape stacking context */}
    {showLiveModal && typeof document !== 'undefined' && createPortal(
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center" style={{ zIndex: 99999 }}>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-semibold text-white">Live Mode Requires Configuration</h2>
          </div>

          <p className="text-gray-300 mb-4">
            To switch to live mode, you need to configure live credentials for the following services:
          </p>

          {missingLiveServices.length > 0 && (
            <ul className="mb-6 space-y-3">
              {missingLiveServices.map((service) => {
                // Map service names to their setup routes
                const setupRoutes: Record<string, string> = {
                  razorpay: '/razorpay-setup',
                  paypal: '/paypal-setup',
                  stripe: '/stripe-setup',
                  twilio: '/onboarding',
                };
                const setupRoute = setupRoutes[service.toLowerCase()] || '/onboarding';

                return (
                  <li key={service} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      <span className="capitalize">{service}</span>
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
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowLiveModal(false)}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
