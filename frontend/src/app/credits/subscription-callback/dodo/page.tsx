"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

function DodoSubscriptionCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const processSubscription = () => {
      // Dodo redirects with subscription_id, not payment_id
      const subscriptionId = searchParams.get("subscription_id");
      const email = searchParams.get("email");
      const status = searchParams.get("status");

      if (!subscriptionId) {
        // No subscription_id, redirect to error page
        const errorUrl = new URL("/credits/subscription-result", window.location.origin);
        errorUrl.searchParams.append("status", "error");
        errorUrl.searchParams.append("message", "Missing subscription ID. Please contact support.");
        window.location.href = errorUrl.toString();
        return;
      }

      // Redirect directly to backend API endpoint
      // The backend will verify the subscription and redirect to the result page
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // Pass subscription_id as payment_id since that's what backend expects
      window.location.href = `${apiUrl}/v1/credits/subscription-callback/dodo?payment_id=${encodeURIComponent(subscriptionId)}`;
    };

    processSubscription();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center" aria-label="Processing subscription">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Processing your subscription...</p>
      </div>
    </div>
  );
}

export default function DodoSubscriptionCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <DodoSubscriptionCallbackContent />
    </Suspense>
  );
}
