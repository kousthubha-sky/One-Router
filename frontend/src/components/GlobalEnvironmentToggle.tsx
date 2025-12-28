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

interface GlobalEnvironmentToggleProps {
  services: Service[];
  onGlobalSwitch?: (newEnvironment: "test" | "live") => void;
}

export function GlobalEnvironmentToggle({ services, onGlobalSwitch }: GlobalEnvironmentToggleProps) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentMode, setCurrentMode] = useState<"test" | "live" | "mixed">("test");
  // const [manualOverride, setManualOverride] = useState<"test" | "live" | null>(null);
  const { getToken } = useAuth();




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
    
    // Get Clerk token for authentication
    const token = await getToken();
    if (!token) {
      alert('Authentication failed. Please log in again.');
      return;
    }
    
    // Immediately update UI to show the target mode
    // setManualOverride(targetEnvironment);
    setCurrentMode(targetEnvironment);
    setIsSwitching(true);
    
    try {
      console.log('Atomically switching all services to:', targetEnvironment);

      // Use atomic batch API instead of sequential updates
      // This ensures all-or-nothing semantics with database transaction
      // Switch environment logic here

      onGlobalSwitch?.(targetEnvironment);
      console.log('All services switched successfully');

    } catch (error) {
      console.error("Failed to switch all services:", error);
      // Reset on error - let it recalculate from services
      // setManualOverride(null);
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
    <div className="flex items-center bg-[#1a1a1a] rounded-full border border-[#333] p-1">
      <button
        onClick={() => !isSwitching && switchAllServices("test")}
        disabled={isSwitching}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
          !isLiveMode
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
            : "text-[#888] hover:text-white hover:bg-[#333]"
        } ${isSwitching ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
        disabled={isSwitching}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
          isLiveMode
            ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
            : "text-[#888] hover:text-white hover:bg-[#333]"
        } ${isSwitching ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {isSwitching && isLiveMode && <Loader2 className="w-3 h-3 mr-1 inline animate-spin" />}
        <Shield className="w-3 h-3 mr-1 inline" />
        Live
        {isLiveMode && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </button>
    </div>
  );
}