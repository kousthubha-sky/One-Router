'use client';

import dynamic from 'next/dynamic';
import {
  ModalSkeleton,
  OnboardingFlowSkeleton,
  FeatureSectionSkeleton,
  MarqueeSkeleton,
  CreditsSkeleton,
  TableSkeleton,
  CardSkeleton,
  LoadingSpinner,
} from '@/components/ui/loading-skeleton';

// Lazy load modals (SSR disabled since they're client-only)
export const LazyEditServiceModal = dynamic(
  () => import('@/components/EditServiceModal').then((mod) => mod.EditServiceModal),
  {
    loading: () => null, // Modals don't need skeleton, they appear on user action
    ssr: false,
  }
);

export const LazyVendorModal = dynamic(
  () => import('@/components/VendorModal').then((mod) => mod.VendorModal),
  {
    loading: () => null,
    ssr: false,
  }
);

export const LazyEditApiKeyModal = dynamic(
  () => import('@/components/ApiKeyModals').then((mod) => mod.EditApiKeyModal),
  {
    loading: () => null,
    ssr: false,
  }
);

export const LazyActivityModal = dynamic(
  () => import('@/components/ApiKeyModals').then((mod) => mod.ActivityModal),
  {
    loading: () => null,
    ssr: false,
  }
);

// Lazy load heavy page components
export const LazyEnvOnboardingFlow = dynamic(
  () => import('@/components/EnvOnboardingFlow'),
  {
    loading: () => <OnboardingFlowSkeleton />,
    ssr: false,
  }
);

export const LazyCreditsPageClient = dynamic(
  () => import('@/components/CreditsPageClient').then((mod) => mod.CreditsPageClient),
  {
    loading: () => <CreditsSkeleton />,
    ssr: false,
  }
);

// Lazy load table components
export const LazyApiKeysTable = dynamic(
  () => import('@/components/ApiKeysTable'),
  {
    loading: () => <TableSkeleton rows={3} />,
    ssr: false,
  }
);

// Lazy load feature/marketing components (home page)
export const LazyFeaturesSectionWithHoverEffects = dynamic(
  () => import('@/components/feature-section-with-hover-effects').then(
    (mod) => mod.FeaturesSectionWithHoverEffects
  ),
  {
    loading: () => <FeatureSectionSkeleton />,
    ssr: false,
  }
);

export const LazyMarqueeDemo = dynamic(
  () => import('@/components/ui/marquee-demo').then((mod) => mod.MarqueeDemo),
  {
    loading: () => <MarqueeSkeleton />,
    ssr: false,
  }
);

// Lazy load service-related components
export const LazyServiceModesOverview = dynamic(
  () => import('@/components/ServiceModesOverview').then((mod) => mod.ServiceModesOverview),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

export const LazyGlobalEnvironmentToggle = dynamic(
  () => import('@/components/GlobalEnvironmentToggle').then((mod) => mod.GlobalEnvironmentToggle),
  {
    loading: () => <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />,
    ssr: false,
  }
);

// Lazy load setup pages
export const LazyRazorpaySetup = dynamic(
  () => import('@/components/RazorpaySetup').then((mod) => mod.RazorpaySetup),
  {
    loading: () => <OnboardingFlowSkeleton />,
    ssr: false,
  }
);

export const LazyPayPalSetup = dynamic(
  () => import('@/components/PayPalSetup').then((mod) => mod.PayPalSetup),
  {
    loading: () => <OnboardingFlowSkeleton />,
    ssr: false,
  }
);

export const LazyTwilioSetup = dynamic(
  () => import('@/components/TwilioSetup').then((mod) => mod.TwilioSetup),
  {
    loading: () => <OnboardingFlowSkeleton />,
    ssr: false,
  }
);

export const LazyResendSetup = dynamic(
  () => import('@/components/ResendSetup').then((mod) => mod.ResendSetup),
  {
    loading: () => <OnboardingFlowSkeleton />,
    ssr: false,
  }
);

// Lazy load BentoGrid (used on multiple pages)
export const LazyBentoGrid = dynamic(
  () => import('@/components/ui/bento-grid').then((mod) => mod.BentoGrid),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="md:col-span-2 bg-[#0a0a0a] border border-[#222] rounded-xl p-6 h-32" />
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 h-32" />
      </div>
    ),
    ssr: false,
  }
);
