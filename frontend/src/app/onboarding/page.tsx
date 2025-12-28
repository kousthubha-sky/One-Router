'use client';


import { useRouter } from "next/navigation";
import EnvOnboardingFlow from "@/components/EnvOnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return <EnvOnboardingFlow onBack={handleBack} />;
}