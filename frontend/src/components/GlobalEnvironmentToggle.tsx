// frontend/src/components/GlobalEnvironmentToggle.tsx
"use client";

import { useState, useEffect } from "react";
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

interface GlobalEnvironmentToggleProps {
  services: Service[];
  onGlobalSwitch?: (newEnvironment: "test" | "live") => void;
  apiClient?: (url: string, options?: RequestOptions) => Promise<Record<string, unknown>>;
}

export function GlobalEnvironmentToggle({ services, onGlobalSwitch, apiClient }: GlobalEnvironmentToggleProps) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentMode, setCurrentMode] = useState<"test" | "live" | "mixed">("test");
  const [showLiveModal, setShowLiveModal] = useState(false);
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
    if (services.length === 0) return;
    
    // Require apiClient for switching environments
    if (!apiClient) {
      console.error("apiClient is required to switch environments");
      alert("Configuration error: Unable to switch environments. Please refresh the page.");
      return;
    }
    
    // If switching to live, check if live credentials are configured
    if (targetEnvironment === "live") {
      try {
        const response = await apiClient("/api/razorpay/can-go-live");
        if (!response.can_go_live) {
          // Show modal with message to configure live keys
          setShowLiveModal(true);
          return;
        }
      } catch (error) {
        console.error("Failed to check live credentials:", error);
        // If check fails, show modal to be safe
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

      await apiClient("/api/services/switch-all-environments", {
        method: "POST",
        body: JSON.stringify({
          environment: targetEnvironment,
          service_ids: services.map(s => s.id)
        })
      });
      
      // Update UI to show the target mode
      setCurrentMode(targetEnvironment);
      onGlobalSwitch?.(targetEnvironment);
      console.log('All services switched successfully');

    } catch (error) {
      console.error("Failed to switch all services:", error);
      // Reset on error
      setCurrentMode("test");
      
      // Show user-friendly error message
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to switch environment: ${errorMsg}\n\nPlease try again.`);
    } finally {
      setIsSwitching(false);
    }
  };



  if (services.length === 0) {
    return null; // Don't show if no services
  }

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

    {/* Modal: Configure Live Keys First */}
    {showLiveModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-semibold text-white">Live Mode Requires Configuration</h2>
          </div>
          
          <p className="text-gray-300 mb-6">
            To switch to live mode, you need to configure and verify your live Razorpay credentials first.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowLiveModal(false)}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <a
              href="/razorpay-setup"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-center"
            >
              Configure Live Keys
            </a>
          </div>
        </div>
      </div>
    )}
    </>
  );
}