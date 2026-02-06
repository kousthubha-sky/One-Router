'use client';

import { useRouter } from "next/navigation";
import { LazyEnvOnboardingFlow } from "@/components/lazy";

export default function OnboardingPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return <LazyEnvOnboardingFlow onBack={handleBack} />;
}