"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionResultData {
  subscription_id: string;
  user_id: string;
  status: string;
  plan_name: string;
  credits: number;
  message: string;
  exp: number;
}

function SubscriptionResultContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<SubscriptionResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("No verification token received");
      setLoading(false);
      return;
    }

    try {
      // Decode JWT token (simple base64 decode, not verifying signature)
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      const payload = JSON.parse(atob(parts[1]));
      setResult(payload);
    } catch (err) {
      setError("Failed to verify subscription result");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050005] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#050005] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0D0D0D] rounded-xl border border-red-500/30 p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Subscription Verification Failed</h1>
          <p className="text-gray-400 mb-6">{error || "Unable to verify subscription result"}</p>
          <Link href="/credits">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Credits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = result.status === "success";

  return (
    <div className="min-h-screen bg-[#050005] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0D0D0D] rounded-xl border border-gray-800 p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Subscription Activated!</h1>
            <p className="text-gray-400 mb-6">{result.message}</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Payment Pending</h1>
            <p className="text-gray-400 mb-6">{result.message}</p>
          </>
        )}

        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Plan</span>
              <span className="text-white font-medium">{result.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Credits Added</span>
              <span className="text-cyan-400 font-medium">{result.credits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className={`font-medium ${isSuccess ? "text-green-400" : "text-yellow-400"}`}>
                {isSuccess ? "Active" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/credits" className="block">
            <Button className={`w-full ${isSuccess ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
              {isSuccess ? "View Your Credits" : "Check Status Later"}
            </Button>
          </Link>
          <Link href="/pricing" className="block">
            <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
              Compare Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#050005] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function SubscriptionResultPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionResultContent />
    </Suspense>
  );
}
