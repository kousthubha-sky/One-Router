"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give time for the page to load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const status = searchParams.get("status") || "unknown";
  const message = searchParams.get("message") || "Payment processing...";
  const creditsAdded = searchParams.get("credits") || "0";
  const newBalance = searchParams.get("balance") || "0";

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
                    <span className="text-gray-400">Credits Added:</span>
                    <span className="text-cyan-400 font-semibold">{creditsAdded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">New Balance:</span>
                    <span className="text-cyan-400 font-semibold">{newBalance}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  Your credits have been added to your account and are ready to use.
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