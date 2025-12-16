import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertCircle, Shield, Zap, FileCode } from "lucide-react";

// Service Detection Types
type ServiceStatus = "supported" | "unsupported";
type DetectedService = {
  name: string;
  status: ServiceStatus;
  keys: string[];
  features: string[];
  feature_metadata?: any;
};

// Environment Parser Component
const EnvOnboardingFlow = ({ onBack }: { onBack: () => void }) => {
  const { getToken, isSignedIn } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [detectedServices, setDetectedServices] = useState<DetectedService[]>([]);
  const [step, setStep] = useState<"upload" | "review" | "complete">("upload");
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Supported services
  const SUPPORTED_SERVICES = {
    razorpay: { patterns: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"], features: ["Payments", "Refunds", "Webhooks"] },
    stripe: { patterns: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"], features: ["Payments", "Subscriptions", "Refunds"] },
    paypal: { patterns: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"], features: ["Payments", "Payouts"] },
    twilio: { patterns: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], features: ["SMS", "Calls", "Verification"] },
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
        throw new Error(result.errors ? Object.values(result.errors)[0] : 'Parse error');
      }

      // Store session ID for configure request
      setSessionId(result.session_id);

      // Convert backend response to frontend format
      const detected: DetectedService[] = result.detected_services.map((service: any) => ({
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-[#222] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#00ff88]" />
            <span className="font-mono text-lg font-bold">OneRouter</span>
          </div>
          <button
            onClick={onBack}
            className="text-[#888] hover:text-white font-mono text-sm transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-8 border-b border-[#222]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm",
              step === "upload" ? "border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]" : "border-[#222] text-white"
            )}>
              <Upload className="w-4 h-4" />
              Upload .env
            </div>
            <div className="w-12 h-[2px] bg-[#222]" />
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm",
              step === "review" ? "border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]" : "border-[#222] text-[#888]"
            )}>
              <FileCode className="w-4 h-4" />
              Review Services
            </div>
            <div className="w-12 h[2px] bg-[#222]" />
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm",
              step === "complete" ? "border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]" : "border-[#222] text-[#888]"
            )}>
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {step === "upload" && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-mono">
                  Upload Your <span className="text-[#00ff88]">.env</span> File
                </h1>
                <p className="text-[#888] font-mono text-lg">
                  We will automatically detect and configure your payment services
                </p>
              </div>

              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-12 transition-all",
                  dragActive ? "border-[#00ff88] bg-[#00ff88]/5" : "border-[#222] hover:border-[#00ff88]/50"
                )}
              >
                <input
                  type="file"
                  accept=".env"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-[#888]" />
                  <div>
                    <p className="font-mono text-white mb-2">
                      {parsing ? "Parsing your file..." : file ? file.name : "Drop your .env file here"}
                    </p>
                    <p className="text-sm text-[#888] font-mono">
                      or click to browse
                    </p>
                  </div>
                  {parsing && (
                    <div className="flex justify-center">
                      <div className="flex gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-[#00ff88]"
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

              {/* Security Features */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
                  <Shield className="w-5 h-5 text-[#00ff88] flex shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-mono font-bold text-sm mb-1">AES-256 Encryption</h3>
                    <p className="text-xs text-[#888] font-mono">Your credentials are encrypted at rest</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
                  <Zap className="w-5 h-5 text-[#00ff88] flex shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-mono font-bold text-sm mb-1">Instant Detection</h3>
                    <p className="text-xs text-[#888] font-mono">Auto-detect payment providers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
                  <FileCode className="w-5 h-5 text-[#00ff88] flex shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-mono font-bold text-sm mb-1">Smart Parsing</h3>
                    <p className="text-xs text-[#888] font-mono">Validates all credentials</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-mono">
                  Detected <span className="text-[#00ff88]">{detectedServices.length}</span> Services
                </h1>
                <p className="text-[#888] font-mono text-lg">
                  Review and configure your integrations
                </p>
              </div>

              {/* Detected Services */}
              <div className="space-y-4">
                {detectedServices.filter(s => s.status === "supported").length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-mono text-sm text-[#888] uppercase tracking-wider">Supported Services</h2>
                    {detectedServices.filter(s => s.status === "supported").map((service) => (
                      <div key={service.name} className="bg-[#0a0a0a] border border-[#00ff88]/30 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-[#00ff88]" />
                            <div>
                              <h3 className="font-mono font-bold text-lg capitalize">{service.name}</h3>
                              <p className="text-sm text-[#888] font-mono">{service.keys.length} credentials detected</p>
                            </div>
                          </div>
                          <Badge className="bg-[#00ff88] text-black border-0">Ready</Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-mono text-[#888]">Detected Keys:</p>
                          <div className="flex flex-wrap gap-2">
                            {service.keys.map((key) => (
                              <span key={key} className="px-3 py-1 bg-[#1a1a1a] border border-[#222] rounded font-mono text-xs text-[#00ff88]">
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-mono text-[#888] mb-2">Available Features:</p>
                          <div className="flex flex-wrap gap-2">
                            {service.features.map((feature) => (
                              <span key={feature} className="px-3 py-1 bg-[#1a1a1a] border border-[#00ff88]/30 rounded font-mono text-xs text-white">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detectedServices.filter(s => s.status === "unsupported").length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-mono text-sm text-[#888] uppercase tracking-wider">Services Not Yet Supported</h2>
                    {detectedServices.filter(s => s.status === "unsupported").map((service) => (
                      <div key={service.name} className="bg-[#0a0a0a] border border-[#ffbd2e]/30 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-[#ffbd2e]" />
                            <div>
                              <h3 className="font-mono font-bold text-lg capitalize">{service.name}</h3>
                              <p className="text-sm text-[#888] font-mono">You will need to manage these credentials yourself</p>
                            </div>
                          </div>
                          <Badge className="bg-[#ffbd2e] text-black border-0">Coming Soon</Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-mono text-[#888]">Detected Keys:</p>
                          <div className="flex flex-wrap gap-2">
                            {service.keys.map((key) => (
                              <span key={key} className="px-3 py-1 bg-[#1a1a1a] border border-[#222] rounded font-mono text-xs text-[#ffbd2e]">
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-[#ffbd2e]/10 border border-[#ffbd2e]/30 rounded">
                          <p className="text-xs font-mono text-[#ffbd2e]">
                            ⚠️ We are implementing support for {service.name} in the next phase. These credentials will remain in your .env file.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => setStep("upload")}
                  variant="outline"
                  className="bg-transparent border-[#222] text-white hover:border-[#00ff88] font-mono"
                >
                  Upload Different File
                </Button>
                <Button
                  onClick={handleContinue}
                  className="bg-[#00ff88] text-black hover:bg-[#00dd77] font-mono font-bold"
                  disabled={detectedServices.filter(s => s.status === "supported").length === 0}
                >
                  Continue to Dashboard →
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-8 py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00ff88]/10 border-2 border-[#00ff88]">
                <CheckCircle2 className="w-10 h-10 text-[#00ff88]" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-mono">
                  <span className="text-[#00ff88]">Onboarding Complete!</span>
                </h1>
                <p className="text-[#888] font-mono text-lg">
                  Your services are configured and ready to use
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#00ff88]"
                      style={{
                        animation: "pulse 1s ease-in-out infinite",
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
    </div>
  );
};

export default EnvOnboardingFlow;