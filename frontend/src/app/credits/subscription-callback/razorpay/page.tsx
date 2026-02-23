"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

function RazorpaySubscriptionCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const processSubscription = () => {
      // Extract Razorpay subscription parameters
      const paymentId = searchParams.get("razorpay_payment_id");
      const orderId = searchParams.get("razorpay_order_id");
      const paymentLinkId = searchParams.get("razorpay_payment_link_id");
      const paymentLinkReferenceId = searchParams.get("razorpay_payment_link_reference_id");
      const paymentLinkStatus = searchParams.get("razorpay_payment_link_status");
      const signature = searchParams.get("razorpay_signature");

      if (!paymentId && !orderId) {
        // No payment/order ID, redirect to error page
        const errorUrl = new URL("/credits/subscription-result", window.location.origin);
        errorUrl.searchParams.append("status", "error");
        errorUrl.searchParams.append("message", "Missing payment information. Please contact support.");
        window.location.href = errorUrl.toString();
        return;
      }

      // Build query params for backend
      const queryParams = new URLSearchParams();
      if (paymentId) queryParams.append("razorpay_payment_id", paymentId);
      if (orderId) queryParams.append("razorpay_order_id", orderId);
      if (paymentLinkId) queryParams.append("razorpay_payment_link_id", paymentLinkId);
      if (paymentLinkReferenceId) queryParams.append("razorpay_payment_link_reference_id", paymentLinkReferenceId);
      if (paymentLinkStatus) queryParams.append("razorpay_payment_link_status", paymentLinkStatus);
      if (signature) queryParams.append("razorpay_signature", signature);

      // Redirect to backend API endpoint
      // The backend will verify the subscription and redirect to the result page
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      window.location.href = `${apiUrl}/v1/credits/subscription-callback/razorpay?${queryParams.toString()}`;
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

export default function RazorpaySubscriptionCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <RazorpaySubscriptionCallbackContent />
    </Suspense>
  );
}
