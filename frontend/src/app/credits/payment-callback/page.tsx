"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract Razorpay params and process payment
    const processPayment = async () => {
      try {
        const paymentId = searchParams.get("razorpay_payment_id");
        const paymentLinkId = searchParams.get("razorpay_payment_link_id");
        const paymentLinkStatus = searchParams.get("razorpay_payment_link_status");
        const signature = searchParams.get("razorpay_signature");

        if (!paymentId || !paymentLinkStatus) {
          throw new Error("Missing payment parameters");
        }

        // Build query params for backend
        const queryParams = new URLSearchParams();
        queryParams.append("razorpay_payment_id", paymentId);
        if (paymentLinkId) queryParams.append("razorpay_payment_link_id", paymentLinkId);
        queryParams.append("razorpay_payment_link_status", paymentLinkStatus);
        if (signature) queryParams.append("razorpay_signature", signature);

        // Call backend to process the payment
        const response = await fetch(`/v1/credits/payment-callback?${queryParams.toString()}`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();

        // Redirect to result page with response data
        const resultUrl = new URL("/credits/payment-result", window.location.origin);
        resultUrl.searchParams.append("status", data.status || "error");
        resultUrl.searchParams.append("message", data.message || "");
        resultUrl.searchParams.append("credits", String(data.credits_added || 0));
        resultUrl.searchParams.append("balance", String(data.new_balance || 0));

        window.location.href = resultUrl.toString();
      } catch (error) {
        const errorUrl = new URL("/credits/payment-result", window.location.origin);
        errorUrl.searchParams.append("status", "error");
        errorUrl.searchParams.append("message", "Failed to process payment. Please try again or contact support.");
        window.location.href = errorUrl.toString();
      }
    };

    processPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center" aria-label="Processing payment">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Processing your payment...</p>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}