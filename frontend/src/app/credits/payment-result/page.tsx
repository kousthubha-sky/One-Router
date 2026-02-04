"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

interface PaymentResult {
  status: string;
  message: string;
  credits: number;
  balance: number;
  payment_id?: string;
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult>({
    status: "unknown",
    message: "Payment processing...",
    credits: 0,
    balance: 0,
  });

  useEffect(() => {
    async function verifyPayment() {
      const token = searchParams.get("token");

      if (token) {
        // Verify the signed token from backend
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const response = await fetch(
            `${apiUrl}/v1/credits/payment-result/verify?token=${encodeURIComponent(token)}`
          );
          const data = await response.json();
          setResult({
            status: data.status || "error",
            message: data.message || "Unable to verify payment",
            credits: data.credits || 0,
            balance: data.balance || 0,
            payment_id: data.payment_id,
          });
        } catch (error) {
          console.error("Failed to verify payment:", error);
          setResult({
            status: "error",
            message: "Failed to verify payment status",
            credits: 0,
            balance: 0,
          });
        }
      } else {
        // Fallback to query params (for direct redirects)
        setResult({
          status: searchParams.get("status") || "unknown",
          message: searchParams.get("message") || "Payment processing...",
          credits: parseInt(searchParams.get("credits") || "0", 10),
          balance: parseInt(searchParams.get("balance") || "0", 10),
        });
      }
      setLoading(false);
    }

    verifyPayment();
  }, [searchParams]);

  const status = result.status;
  const message = result.message;
  // Credits are stored in cents, convert to dollars for display
  const creditsAdded = (result.credits * 0.01).toFixed(2);
  const newBalance = (result.balance * 0.01).toFixed(2);

  const isSuccess = status === "success";
  const isFailed = status === "failed" || status === "error";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Processing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto pt-16">
        <Card className={`${
          isSuccess
            ? "border-green-500/50 bg-green-500/10"
            : isFailed
            ? "border-red-500/50 bg-red-500/10"
            : "border-gray-700 bg-gray-900/50"
        }`}>
          <CardHeader>
            <div className="text-center">
              {isSuccess && (
                <div className="text-4xl mb-2">✓</div>
              )}
              {isFailed && (
                <div className="text-4xl mb-2">✕</div>
              )}
              <CardTitle className={`${
                isSuccess
                  ? "text-green-400"
                  : isFailed
                  ? "text-red-400"
                  : "text-gray-400"
              }`}>
                {isSuccess ? "Payment Successful" : isFailed ? "Payment Failed" : "Payment Processing"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300 text-center">{message}</p>

            {isSuccess && (
              <>
                <div className="bg-black/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Added:</span>
                    <span className="text-green-400 font-semibold">+${creditsAdded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">New Balance:</span>
                    <span className="text-cyan-400 font-semibold">${newBalance}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  Your balance has been updated and is ready to use.
                </p>
              </>
            )}

            {isFailed && (
              <p className="text-sm text-gray-500 text-center">
                Please try again or contact support if the problem persists.
              </p>
            )}
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Link href="/credits" className="w-full block">  
                        Back to Credits  
                    </Link>
                </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}