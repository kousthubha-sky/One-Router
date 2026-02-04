import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Upload, Check, AlertCircle, ChevronRight, Eye, EyeOff,
  ArrowLeft, FileText, Settings, Loader2, Plus,
  CreditCard, MessageSquare, Mail, ArrowRight, Sparkles
} from "lucide-react";

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

const SERVICE_ICONS: Record<string, string> = {
  razorpay: "https://razorpay.com/favicon.ico",
  paypal: "https://www.paypalobjects.com/webstatic/icon/pp258.png",
  twilio: "https://www.twilio.com/favicon.ico",
  resend: "https://resend.com/favicon.ico",
  aws_s3: "https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico",
};

const PROVIDER_SETUP_LINKS = [
  {
    name: "Razorpay",
    href: "/razorpay-setup",
    icon: CreditCard,
    description: "Accept INR payments via UPI, cards, netbanking",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    name: "PayPal",
    href: "/paypal-setup",
    icon: CreditCard,
    description: "International USD/EUR payments",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20"
  },
  {
    name: "Twilio",
    href: "/twilio-setup",
    icon: MessageSquare,
    description: "Send SMS messages globally",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  },
  {
    name: "Resend",
    href: "/resend-setup",
    icon: Mail,
    description: "Transactional emails with high deliverability",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20"
  },
];

const EnvOnboardingFlow = ({ onBack }: { onBack: () => void }) => {
  const { getToken, isSignedIn } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [detectedServices, setDetectedServices] = useState<DetectedService[]>([]);
  const [step, setStep] = useState<"welcome" | "existing" | "upload" | "review" | "complete">("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [existingServices, setExistingServices] = useState<DetectedService[]>([]);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [configuring, setConfiguring] = useState(false);

  const toggleShowKeys = (serviceName: string) => {
    setShowKeys(prev => ({ ...prev, [serviceName]: !prev[serviceName] }));
  };

  useEffect(() => {
    checkExistingServices();
  }, []);

  const checkExistingServices = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const existing: DetectedService[] = data.services.map((service: BackendService) => ({
          name: service.service_name,
          status: "supported" as ServiceStatus,
          keys: [],
          features: Object.keys(service.features || {}).filter(key => service.features[key])
        }));
        setExistingServices(existing);
        // If user has services, skip welcome
        if (existing.length > 0) {
          setStep("existing");
        }
      }
    } catch (error) {
      console.error('Error checking existing services:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const parseEnvFile = async (fileContent: string) => {
    setParsing(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      const blob = new Blob([fileContent], { type: 'text/plain' });
      formData.append('file', new File([blob], 'env.txt', { type: 'text/plain' }));

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/onboarding/parse`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`Failed to parse file`);

      const result = await response.json();
      if (result.status === 'error') throw new Error(result.errors ? String(Object.values(result.errors)[0]) : 'Parse error');

      setSessionId(result.session_id);
      const detected: DetectedService[] = result.detected_services.map((service: BackendService) => ({
        name: service.service_name,
        status: "supported",
        keys: service.detected_keys,
        features: Object.entries(service.features).filter(([_, enabled]) => enabled).map(([feature]) => feature.charAt(0).toUpperCase() + feature.slice(1)),
        feature_metadata: service.feature_metadata
      }));

      setDetectedServices(detected);
      setStep("review");
    } catch (error) {
      console.error('Parse error:', error);
      alert(`Failed to parse .env file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = async (uploadedFile: File) => {
    if (!uploadedFile.name.endsWith(".env")) {
      alert("Please upload a .env file");
      return;
    }
    if (uploadedFile.size > 1024 * 1024) {
      alert("File too large. Maximum 1MB allowed.");
      return;
    }
    setFile(uploadedFile);
    await parseEnvFile(await uploadedFile.text());
  };

  const handleConfigure = async () => {
    if (!isSignedIn) return alert("You must be signed in to configure services.");

    const token = await getToken();
    if (!token) return alert("Failed to retrieve authentication token.");

    const supportedServices = detectedServices.filter(s => s.status === "supported");
    if (supportedServices.length === 0) return alert("No supported services detected.");

    setConfiguring(true);
    try {
      const services = supportedServices.map(service => ({
        service_name: service.name,
        credentials: {},
        features: service.features.reduce((acc, feature) => ({ ...acc, [feature.toLowerCase()]: true }), {}),
        feature_metadata: service.feature_metadata || {}
      }));

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/onboarding/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ services, session_id: sessionId }),
      });

      if (!response.ok) throw new Error(`Configuration failed`);

      setStep("complete");
      setTimeout(onBack, 2000);
    } catch (error) {
      alert(`Failed to configure services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConfiguring(false);
    }
  };

  const steps = [
    { key: "welcome", label: "Start" },
    { key: "existing", label: "Services" },
    { key: "upload", label: "Upload" },
    { key: "review", label: "Review" },
    { key: "complete", label: "Done" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Compact Header */}
      <div className=" bg-transparent backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Inline Steps */}
          <div className="flex items-center gap-1">
            {steps.filter(s => s.key !== "welcome").map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                  currentStepIndex > steps.findIndex(st => st.key === s.key) && "text-emerald-400",
                  step === s.key && "text-white bg-white/10",
                  currentStepIndex < steps.findIndex(st => st.key === s.key) && "text-zinc-600"
                )}>
                  {currentStepIndex > steps.findIndex(st => st.key === s.key) ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{i + 1}</span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.filter(st => st.key !== "welcome").length - 1 && <ChevronRight className="w-3 h-3 text-zinc-700 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Step: Welcome (New users) */}
        {step === "welcome" && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">Welcome to OneRouter</h1>
              <p className="text-zinc-500 max-w-md mx-auto">
                Connect your payment and communication providers to start making API calls.
              </p>
            </div>

            {/* Quick Setup Options */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Choose a provider to set up</p>

              {PROVIDER_SETUP_LINKS.map((provider) => (
                <Link
                  key={provider.name}
                  href={provider.href}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all hover:scale-[1.01]",
                    provider.bgColor, provider.borderColor, "hover:border-opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", provider.bgColor)}>
                      <provider.icon className={cn("w-5 h-5", provider.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{provider.name}</p>
                      <p className="text-xs text-zinc-500">{provider.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#09090b] px-3 text-zinc-600">or</span>
              </div>
            </div>

            {/* Bulk Import Option */}
            <button
              onClick={() => setStep("upload")}
              className="w-full flex items-center justify-center gap-3 p-4 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Import multiple services from .env file</span>
            </button>

            {/* Skip for now */}
            <button
              onClick={onBack}
              className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Skip for now, explore dashboard
            </button>
          </div>
        )}

        {/* Step: Existing Services */}
        {step === "existing" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold mb-1">Your Services</h1>
              <p className="text-sm text-zinc-500">Manage existing services or add new ones</p>
            </div>

            {existingServices.length > 0 ? (
              <div className="space-y-2">
                {existingServices.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={SERVICE_ICONS[service.name.toLowerCase()] || `https://ui-avatars.com/api/?name=${service.name}&background=18181b&color=fff&size=32`}
                        alt={service.name}
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium capitalize">{service.name}</p>
                        <p className="text-xs text-zinc-500">{service.features.slice(0, 2).join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded">Active</span>
                      <Link href={`/${service.name.toLowerCase()}-setup`} className="p-1.5 hover:bg-zinc-800 rounded transition-colors">
                        <Settings className="w-4 h-4 text-zinc-500" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No services configured yet
              </div>
            )}

            {/* Add more services */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Add more services</p>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDER_SETUP_LINKS.map((provider) => (
                  <Link
                    key={provider.name}
                    href={provider.href}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-all",
                      "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600"
                    )}
                  >
                    <provider.icon className={cn("w-4 h-4", provider.color)} />
                    <span className="text-sm">{provider.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("upload")}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Import from .env file
            </button>
          </div>
        )}

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold mb-1">Upload Environment File</h1>
              <p className="text-sm text-zinc-500">We&apos;ll automatically detect your services</p>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-all",
                dragActive ? "border-cyan-500 bg-cyan-500/5" : "border-zinc-800 hover:border-zinc-600"
              )}
            >
              <input
                type="file"
                accept=".env"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-3">
                {parsing ? (
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-500" />
                ) : (
                  <div className="w-10 h-10 mx-auto bg-zinc-800 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{parsing ? "Analyzing..." : file ? file.name : "Drop .env file here"}</p>
                  <p className="text-xs text-zinc-500 mt-1">{parsing ? "Detecting services" : "or click to browse"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Encrypted", desc: "AES-256" },
                { label: "Auto-detect", desc: "50+ Services" },
                { label: "Secure", desc: "Zero storage" },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => existingServices.length > 0 ? setStep("existing") : setStep("welcome")}
              className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Back to manual setup
            </button>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold mb-1">Review Services</h1>
              <p className="text-sm text-zinc-500">
                {detectedServices.filter(s => s.status === "supported").length} services detected
              </p>
            </div>

            <div className="space-y-2">
              {detectedServices.filter(s => s.status === "supported").map((service) => (
                <div key={service.name} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={SERVICE_ICONS[service.name.toLowerCase()] || `https://ui-avatars.com/api/?name=${service.name}&background=18181b&color=fff&size=32`}
                        alt={service.name}
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium capitalize">{service.name}</p>
                        <p className="text-xs text-emerald-400">Ready to configure</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleShowKeys(service.name)}
                      className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    >
                      {showKeys[service.name] ? <EyeOff className="w-4 h-4 text-zinc-500" /> : <Eye className="w-4 h-4 text-zinc-500" />}
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {service.keys.slice(0, showKeys[service.name] ? undefined : 2).map((key) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <div className="w-1 h-1 rounded-full bg-zinc-600" />
                        <code className="text-zinc-400 font-mono">
                          {showKeys[service.name] ? key : `${key.substring(0, 20)}...`}
                        </code>
                      </div>
                    ))}
                    {!showKeys[service.name] && service.keys.length > 2 && (
                      <p className="text-xs text-zinc-600 pl-3">+{service.keys.length - 2} more</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {service.features.map((feature) => (
                      <span key={feature} className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {detectedServices.filter(s => s.status === "unsupported").length > 0 && (
                <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Unsupported services</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedServices.filter(s => s.status === "unsupported").map((service) => (
                      <span key={service.name} className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400/80 rounded capitalize">
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 px-4 py-2.5 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-900 transition-colors"
              >
                Upload Different File
              </button>
              <button
                onClick={handleConfigure}
                disabled={configuring || detectedServices.filter(s => s.status === "supported").length === 0}
                className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {configuring ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {configuring ? "Configuring..." : `Configure ${detectedServices.filter(s => s.status === "supported").length} Services`}
              </button>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="text-center py-16 space-y-4">
            <div className="w-12 h-12 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold mb-1">Setup Complete</h1>
              <p className="text-sm text-zinc-500">Redirecting to dashboard...</p>
            </div>
            <Loader2 className="w-4 h-4 mx-auto animate-spin text-zinc-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvOnboardingFlow;
