import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertCircle, Shield, Zap, FileCode, X, Lock, Globe, Cpu, Server, Eye, EyeOff, RefreshCw } from "lucide-react";

// Service Detection Types
type ServiceStatus = "supported" | "unsupported";
type DetectedService = {
  name: string;
  status: ServiceStatus;
  keys: string[];
  features: string[];
  feature_metadata?: Record<string, unknown>;
};

type BackendService = {
  service_name: string;
  detected_keys: string[];
  features: Record<string, boolean>;
  feature_metadata?: Record<string, unknown>;
};

// Environment Parser Component
const EnvOnboardingFlow = ({ onBack }: { onBack: () => void }) => {
  const { getToken, isSignedIn } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [detectedServices, setDetectedServices] = useState<DetectedService[]>([]);
  const [step, setStep] = useState<"check-existing" | "upload" | "review" | "complete">("check-existing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [existingServices, setExistingServices] = useState<DetectedService[]>([]);
  const [detectedEnvironment, setDetectedEnvironment] = useState<"test" | "live" | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [editingKey, setEditingKey] = useState<{ service: string; key: string; value: string } | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleShowKeys = (serviceName: string) => {
    setShowKeys(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const checkExistingServices = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Get existing services
      const servicesResponse = await fetch(`${API_BASE_URL}/api/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        const existing: DetectedService[] = servicesData.services.map((service: BackendService) => ({
          name: service.service_name,
          status: "supported" as ServiceStatus,
          keys: [], // We'll detect these from environment variables
          features: Object.keys(service.features || {}).filter(key => service.features[key])
        }));
        setExistingServices(existing);
      }

      // Try to detect environment from current variables
      await detectEnvironmentVariables();

    } catch (error) {
      console.error('Error checking existing services:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  // Check existing services on mount
  useEffect(() => {
    checkExistingServices();
  }, []);

  const detectEnvironmentVariables = async () => {
    try {
      // This is a simplified detection - in production, you might check actual environment variables
      // For now, we'll detect based on existing service configurations
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Check if any services are configured with live credentials
      let hasLiveCredentials = false;
      for (const service of existingServices) {
        try {
          const envResponse = await fetch(`${API_BASE_URL}/api/services/${encodeURIComponent(service.name)}/environments`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (envResponse.ok) {
            const envData = await envResponse.json();
            if (envData.live?.configured) {
              hasLiveCredentials = true;
              break;
            }
          }
        } catch {
          // Ignore errors for individual services
        }
      }

      setDetectedEnvironment(hasLiveCredentials ? "live" : "test");
    } catch (error) {
      console.error('Error detecting environment:', error);
      setDetectedEnvironment("test"); // Default to test
    }
  };

  const handleKeyEdit = (serviceName: string, keyName: string) => {
    setEditingKey({ service: serviceName, key: keyName, value: "" });
  };

  const handleKeyEditSubmit = () => {
    // Here you would typically send the updated key to the backend
    setEditingKey(null);
  };

  const handleExistingCheckComplete = () => {
    setStep("upload");
  };

  // Supported services
  const SUPPORTED_SERVICES = {
    razorpay: { patterns: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"], features: ["Payments", "Refunds", "Webhooks"] },
    paypal: { patterns: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"], features: ["Payments", "Payouts"] },
    twilio: { patterns: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], features: ["SMS", "Calls", "Verification"] },
    resend: { patterns: ["RESEND_API_KEY"], features: ["Email", "Transactional", "Marketing"] },
    aws_s3: { patterns: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"], features: ["Storage", "File Upload", "CDN"] },
  };

  const parseEnvFile = async (fileContent: string) => {
    setParsing(true);

    try {
      // Get authentication token
      const token = await getToken();
      // Call the backend API to parse the file
      const formData = new FormData();
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'env.txt', { type: 'text/plain' });
      formData.append('file', file);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const parseResponse = await fetch(`${API_BASE_URL}/api/onboarding/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error(`Failed to parse file: ${parseResponse.status}`);
      }

      const result = await parseResponse.json();

      if (result.status === 'error') {
        throw new Error(result.errors ? String(Object.values(result.errors)[0]) : 'Parse error');
      }

      // Store session ID for configure request
      setSessionId(result.session_id);

      // Convert backend response to frontend format
      const detected: DetectedService[] = result.detected_services.map((service: BackendService) => ({
        name: service.service_name,
        status: "supported", // All detected services from backend are supported
        keys: service.detected_keys,
        features: Object.entries(service.features)
          .filter(([_, enabled]) => enabled)
          .map(([feature, _]) => feature.charAt(0).toUpperCase() + feature.slice(1)),
        feature_metadata: service.feature_metadata // Store metadata for configure request
      }));

      setDetectedServices(detected);
      setParsing(false);
      setParsed(true);
      setStep("review");

    } catch (error) {
      console.error('Parse error:', error);
      setParsing(false);
      alert(`Failed to parse .env file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (uploadedFile: File) => {
    // Validate file
    if (!uploadedFile.name.endsWith(".env")) {
      alert("Please upload a .env file");
      return;
    }

    if (uploadedFile.size > 1024 * 1024) { // 1MB limit
      alert("File too large. Maximum 1MB allowed.");
      return;
    }

    setFile(uploadedFile);
    const content = await uploadedFile.text();
    await parseEnvFile(content);
  };

  const handleContinue = async () => {
    try {
      // Check if user is authenticated
      if (!isSignedIn) {
        alert("You must be signed in to configure services.");
        return;
      }

      // Get Clerk JWT token
      const token = await getToken();
      if (!token) {
        alert("Failed to retrieve authentication token. Please try signing in again.");
        return;
      }

      // Get supported services
      const supportedServices = detectedServices.filter(s => s.status === "supported");

      if (supportedServices.length === 0) {
        alert("No supported services detected. Please upload a different .env file.");
        return;
      }

      // Prepare configuration request
      const services = supportedServices.map(service => ({
        service_name: service.name,
        credentials: {}, // Will be extracted from parsed .env in backend
        features: service.features.reduce((acc, feature) => ({
          ...acc,
          [feature.toLowerCase()]: true
        }), {}),
        feature_metadata: service.feature_metadata || {}
      }));

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/onboarding/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ services, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Configuration failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Services configured successfully');

      setStep("complete");
      setTimeout(() => {
        onBack(); // Return to dashboard
      }, 2000);

    } catch (error) {
      console.error('Configuration error:', error);
      alert(`Failed to configure services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "check-existing", label: "Check", icon: Server, mobileLabel: "Check" },
      { key: "upload", label: "Upload", icon: Upload, mobileLabel: "Upload" },
      { key: "review", label: "Review", icon: FileCode, mobileLabel: "Review" },
      { key: "complete", label: "Complete", icon: CheckCircle2, mobileLabel: "Done" },
    ];

    return (
      <div className="relative px-4 sm:px-6 lg:px-8 py-6 md:py-8 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Connection Lines */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>
            
            <div className="relative z-10 flex items-center justify-between w-full">
              {steps.map((stepItem, index) => {
                const isActive = step === stepItem.key;
                const isCompleted = steps.findIndex(s => s.key === step) > index;

                return (
                  <div key={stepItem.key} className="flex flex-col items-center">
                    <div className={cn(
                      "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                      isActive 
                        ? "border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/30"
                        : isCompleted
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-white/30 bg-black/50"
                    )}>
                      <stepItem.icon className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300",
                        isActive 
                          ? "text-cyan-400"
                          : isCompleted
                          ? "text-cyan-500"
                          : "text-white/50"
                      )} />
                      
                      {/* Animated pulse for active step */}
                      {isActive && (
                        <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-ping opacity-30"></div>
                      )}
                    </div>
                    
                    <span className={cn(
                      "mt-2 text-xs sm:text-sm font-medium transition-all duration-300 hidden sm:block",
                      isActive 
                        ? "text-cyan-400"
                        : isCompleted
                        ? "text-cyan-500"
                        : "text-white/50"
                    )}>
                      {stepItem.label}
                    </span>
                    <span className={cn(
                      "mt-2 text-xs font-medium transition-all duration-300 sm:hidden",
                      isActive 
                        ? "text-cyan-400"
                        : isCompleted
                        ? "text-cyan-500"
                        : "text-white/50"
                    )}>
                      {stepItem.mobileLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-cyan-500/30">
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
              </div>
              <div>
                <span className="font-semibold text-white text-lg sm:text-xl">Env Configurator</span>
                <p className="text-xs sm:text-sm text-cyan-500/70 mt-0.5">Secure environment setup</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="group relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 text-sm sm:text-base text-white/80 group-hover:text-white transition-colors duration-300">
                ← Dashboard
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {step === "check-existing" && (
            <div className="space-y-8 sm:space-y-12">
              <div className="text-center space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  Scanning Your <span className="text-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 bg-clip-text bg-[length:200%_100%] animate-gradient">Environment</span>
                </h1>
                <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  Checking existing configurations and detecting your current setup
                </p>
              </div>

              {checkingExisting ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Server className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 text-center">
                    <p className="text-white font-medium text-sm sm:text-base">Analyzing your environment...</p>
                    <p className="text-white/50 text-xs sm:text-sm">Checking services, keys, and configurations</p>
                    <div className="flex gap-1.5 justify-center">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-cyan-500"
                          style={{
                            animation: "bounce 1.4s infinite",
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 sm:space-y-12">
                  {/* Existing Services */}
                  {existingServices.length > 0 && (
                    <div className="space-y-6 sm:space-y-8">
                      <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                          Existing Services
                        </h2>
                        <p className="text-white/50 text-sm sm:text-base">Services already configured in your account</p>
                      </div>
                      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {existingServices.map((service) => (
                          <div 
                            key={service.name} 
                            className="group relative p-4 sm:p-6 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl sm:rounded-2xl hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 overflow-hidden"
                          >
                            {/* Background gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
                            
                            <div className="relative z-10">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-cyan-500/20">
                                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-white text-base sm:text-lg capitalize">{service.name}</p>
                                    <Badge 
                                      variant="secondary" 
                                      className="mt-1 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs px-2 py-0.5"
                                    >
                                      Active
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Features */}
                              <div className="pt-4 border-t border-white/10">
                                <p className="text-white/50 text-xs mb-2">Enabled Features</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {service.features.slice(0, 3).map((feature) => (
                                    <span 
                                      key={feature} 
                                      className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                  {service.features.length > 3 && (
                                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
                                      +{service.features.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detected Environment */}
                  {detectedEnvironment && (
                    <div className="text-center space-y-6">
                      <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl sm:rounded-2xl max-w-md mx-auto">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                          {detectedEnvironment === "live" ? (
                            <Globe className="w-7 h-7 text-green-400" />
                          ) : (
                            <Zap className="w-7 h-7 text-cyan-500" />
                          )}
                        </div>
                        <div className="text-center sm:text-left">
                          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                            {detectedEnvironment === "live" ? "Live Environment" : "Test Environment"}
                          </h2>
                          <p className="text-white/50 text-sm">
                            {detectedEnvironment === "live"
                              ? "Production-ready environment detected"
                              : "Development environment detected"
                            }
                          </p>
                        </div>
                        <Badge className={cn(
                          "text-sm px-3 py-1 font-medium",
                          detectedEnvironment === "live"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        )}>
                          {detectedEnvironment.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="text-center pt-4">
                    <Button
                      onClick={handleExistingCheckComplete}
                      className="group relative px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 overflow-hidden"
                    >
                      <span className="relative z-10 text-sm sm:text-base font-medium">
                        {existingServices.length > 0
                          ? "Add More Services →"
                          : "Upload .env File →"
                        }
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-8 sm:space-y-12">
              <div className="text-center space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  Upload <span className="text-transparent bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text">.env</span> File
                </h1>
                <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  Drag & drop your environment file for automatic service detection
                </p>
              </div>

              {/* Upload Area */}
              <div className="max-w-2xl mx-auto">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative group border-2 border-dashed rounded-xl sm:rounded-2xl p-8 sm:p-12 transition-all duration-300",
                    dragActive
                      ? "border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/20"
                      : "border-white/20 hover:border-cyan-500/50 hover:bg-white/5"
                  )}
                >
                  <input
                    type="file"
                    accept=".env"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-500"></div>
                  
                  <div className="relative z-10 text-center space-y-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/40 transition-all duration-300">
                      {parsing ? (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-lg sm:text-xl font-medium mb-2">
                        {parsing ? "Analyzing file..." : file ? file.name : "Drop your .env file here"}
                      </p>
                      <p className="text-white/50 text-sm">
                        {parsing ? "Detecting services and configurations..." : "or click to select file"}
                      </p>
                    </div>
                    {parsing && (
                      <div className="flex justify-center">
                        <div className="flex gap-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-cyan-500"
                              style={{
                                animation: "pulse 1s ease-in-out infinite",
                                animationDelay: `${i * 0.2}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-5 sm:p-6 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 mb-3 sm:mb-4">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1 sm:mb-2">End-to-End Encryption</h3>
                  <p className="text-white/50 text-xs sm:text-sm leading-relaxed">Military-grade AES-256 encryption for all credentials</p>
                </div>
                <div className="p-5 sm:p-6 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 mb-3 sm:mb-4">
                    <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1 sm:mb-2">Smart Detection</h3>
                  <p className="text-white/50 text-xs sm:text-sm leading-relaxed">Auto-detects 50+ services with pattern matching</p>
                </div>
                <div className="p-5 sm:p-6 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 mb-3 sm:mb-4">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1 sm:mb-2">Zero Storage</h3>
                  <p className="text-white/50 text-xs sm:text-sm leading-relaxed">Your keys never leave your browser or backend</p>
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-8 sm:space-y-12">
              <div className="text-center space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  Review <span className="text-transparent bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text">Services</span>
                </h1>
                <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  {detectedServices.filter(s => s.status === "supported").length} services detected in your environment
                </p>
              </div>

              {/* Detected Services */}
              <div className="space-y-6 sm:space-y-8">
                {detectedServices.filter(s => s.status === "supported").length > 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                      <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">Supported Services</h2>
                      <p className="text-white/50 text-sm">Ready to be configured automatically</p>
                    </div>
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {detectedServices.filter(s => s.status === "supported").map((service) => (
                        <div key={service.name} className="group relative p-5 sm:p-6 bg-gradient-to-b from-white/5 to-transparent border border-cyan-500/20 rounded-xl sm:rounded-2xl hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 overflow-hidden">
                          {/* Background gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
                          
                          <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-cyan-500/20">
                                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" />
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-base sm:text-lg capitalize">{service.name}</p>
                                  <Badge className="mt-1 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs px-2 py-0.5">
                                    Ready
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Keys */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-white/50 text-xs sm:text-sm">Credentials</p>
                                <button
                                  onClick={() => toggleShowKeys(service.name)}
                                  className="text-cyan-500 hover:text-cyan-400 text-xs flex items-center gap-1 transition-colors"
                                >
                                  {showKeys[service.name] ? (
                                    <>
                                      <EyeOff className="w-3 h-3" />
                                      <span>Hide</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3" />
                                      <span>Show</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {service.keys.slice(0, 3).map((key) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>
                                    <code className="text-xs text-white/70 font-mono truncate">
                                      {showKeys[service.name] ? key : `${key.substring(0, 15)}...`}
                                    </code>
                                  </div>
                                ))}
                                {service.keys.length > 3 && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/30"></div>
                                    <span className="text-xs text-white/50">
                                      +{service.keys.length - 3} more
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Features */}
                            <div className="pt-4 border-t border-white/10">
                              <p className="text-white/50 text-xs mb-2">Features</p>
                              <div className="flex flex-wrap gap-1.5">
                                {service.features.slice(0, 3).map((feature) => (
                                  <span 
                                    key={feature} 
                                    className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-400"
                                  >
                                    {feature}
                                  </span>
                                ))}
                                {service.features.length > 3 && (
                                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
                                    +{service.features.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detectedServices.filter(s => s.status === "unsupported").length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm sm:text-base font-medium text-white/80 uppercase tracking-wider">Unsupported Services</h2>
                    <div className="grid gap-4">
                      {detectedServices.filter(s => s.status === "unsupported").map((service) => (
                        <div key={service.name} className="p-5 sm:p-6 bg-gradient-to-b from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl sm:rounded-2xl">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                              <div>
                                <h3 className="font-semibold text-white text-base sm:text-lg capitalize">{service.name}</h3>
                                <p className="text-white/50 text-xs sm:text-sm">Manual configuration required</p>
                              </div>
                            </div>
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Coming Soon</Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-white/50 text-xs sm:text-sm">Detected Keys</p>
                            <div className="flex flex-wrap gap-1.5">
                              {service.keys.map((key) => (
                                <span key={key} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 font-mono">
                                  {key}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 sm:pt-8">
                <Button
                  onClick={() => setStep("upload")}
                  variant="outline"
                  className="px-6 py-3 sm:px-8 sm:py-3.5 bg-transparent border-white/20 text-white hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-xl transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Upload Different File
                </Button>
                <Button
                  onClick={handleContinue}
                  className="group px-8 py-3 sm:px-12 sm:py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-xl hover:shadow-cyan-500/25 rounded-xl transition-all duration-300 overflow-hidden"
                  disabled={detectedServices.filter(s => s.status === "supported").length === 0}
                >
                  <span className="relative z-10 text-sm sm:text-base font-medium">
                    Configure {detectedServices.filter(s => s.status === "supported").length} Services →
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-8 sm:space-y-12 py-12 sm:py-16">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-500" />
                </div>
                {/* Pulsing effect */}
                <div className="absolute inset-0 mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-cyan-500/20 animate-ping"></div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="text-transparent bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text">Setup Complete!</span>
                </h1>
                <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  All services have been configured successfully. You can now start using them immediately.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyan-500"
                      style={{
                        animation: "bounce 1.4s infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Key Dialog Modal */}
      {editingKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#0a0a0a] to-black border border-cyan-500/30 rounded-xl sm:rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                Update API Key
              </h3>
              <button
                onClick={() => setEditingKey(null)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-white/50 text-xs sm:text-sm mb-2">Service</p>
                <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white capitalize">
                  {editingKey.service}
                </div>
              </div>

              <div>
                <p className="text-white/50 text-xs sm:text-sm mb-2">Key Name</p>
                <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono">
                  {editingKey.key}
                </div>
              </div>

              <div>
                <p className="text-white/50 text-xs sm:text-sm mb-2">New Value</p>
                <input
                  type="password"
                  value={editingKey.value}
                  onChange={(e) => setEditingKey({ ...editingKey, value: e.target.value })}
                  placeholder="Enter new API key value"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setEditingKey(null)}
                variant="outline"
                className="flex-1 px-4 py-2.5 bg-transparent border-white/20 text-white hover:border-white/40 hover:bg-white/5 rounded-lg transition-all duration-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleKeyEditSubmit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 rounded-lg transition-all duration-300"
                disabled={!editingKey.value}
              >
                Update Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvOnboardingFlow;