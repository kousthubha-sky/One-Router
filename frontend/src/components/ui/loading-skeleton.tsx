'use client';

import { Loader2 } from 'lucide-react';

// Generic loading spinner
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
    </div>
  );
}

// Modal loading skeleton
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#333] rounded-xl w-full max-w-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-10 bg-zinc-800 rounded"></div>
            <div className="h-10 bg-zinc-800 rounded"></div>
            <div className="h-10 bg-zinc-800 rounded"></div>
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-10 bg-zinc-800 rounded flex-1"></div>
            <div className="h-10 bg-zinc-800 rounded flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card loading skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[#0a0a0a] border border-[#222] rounded-xl p-6 animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-5 bg-zinc-800 rounded w-1/4"></div>
        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// Table loading skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden animate-pulse">
      <div className="border-b border-[#222] p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-zinc-800 rounded flex-1"></div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-[#222]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 bg-zinc-800 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Page loading skeleton
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-black p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton />
      </div>
    </div>
  );
}

// Onboarding flow skeleton
export function OnboardingFlowSkeleton() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-pulse space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-1/3 mx-auto"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto"></div>
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-8 space-y-6">
          <div className="h-32 bg-zinc-800 rounded"></div>
          <div className="space-y-4">
            <div className="h-10 bg-zinc-800 rounded"></div>
            <div className="h-10 bg-zinc-800 rounded"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 bg-zinc-800 rounded flex-1"></div>
            <div className="h-10 bg-zinc-800 rounded flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature section skeleton
export function FeatureSectionSkeleton() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="h-10 bg-zinc-800 rounded w-1/3 mx-auto mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-lg"></div>
            <div className="h-5 bg-zinc-800 rounded w-2/3"></div>
            <div className="h-4 bg-zinc-800 rounded w-full"></div>
            <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Marquee skeleton
export function MarqueeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 w-48 h-24 bg-zinc-800 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

// Credits page skeleton
export function CreditsSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-pulse space-y-6">
      <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
      <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
        <div className="h-12 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    </div>
  );
}

// Bento grid skeleton
export function BentoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      <div className="md:col-span-2 bg-[#0a0a0a] border border-[#222] rounded-xl p-6 h-32"></div>
      <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 h-32"></div>
    </div>
  );
}
