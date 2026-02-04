"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

function DodoCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const processPayment = () => {
      const paymentId = searchParams.get("payment_id");

      if (!paymentId) {
        // No payment_id, redirect to error page
        const errorUrl = new URL("/credits/payment-result", window.location.origin);
        errorUrl.searchParams.append("status", "error");
        errorUrl.searchParams.append("message", "Missing payment ID. Please contact support.");
        window.location.href = errorUrl.toString();
        return;
      }

      // Redirect directly to backend API endpoint
      // The backend will verify the payment and redirect to the result page
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      window.location.href = `${apiUrl}/v1/credits/payment-callback/dodo?payment_id=${encodeURIComponent(paymentId)}`;
    };

    processPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center" aria-label="Processing payment">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Processing your Dodo payment...</p>
      </div>
    </div>
  );
}

export default function DodoCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <DodoCallbackContent />
    </Suspense>
  );
}
