"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientApiCall } from "@/lib/api-client";
import { CreditBalance } from "./CreditBalance";

interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price_inr: number;
  price_usd: number;
  per_credit: number;
  description: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 1000,
    price_inr: 100,
    price_usd: 1.20,
    per_credit: 0.10,
    description: "Perfect for testing and small projects",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 10000,
    price_inr: 800,
    price_usd: 9.60,
    per_credit: 0.08,
    description: "Best for growing applications",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 100000,
    price_usd: 84.0,
    per_credit: 0.07,
    price_inr: 7000,
    description: "High-volume usage",
  },
];

export function CreditsPageClient() {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useClientApiCall();

  async function purchaseCredits(plan: PricingPlan) {
    setPurchasing(plan.id);
    setError(null);

    try {
      const response = await apiClient("/v1/credits/purchase", {
        method: "POST",
        body: JSON.stringify({
          credits: plan.credits,
          plan_id: plan.id,
        }),
      }) as { checkout_url?: string; error?: string; [key: string]: unknown };

      // If backend returned an error object, surface it to the user and log
      if (response?.error) {
        const msg = String(response.error);
        console.error("Purchase API returned error:", response);
        setError(msg || "Failed to initiate purchase");
        return;
      }

      // Demo flow: show informational alert instead of redirecting
      if (response?.checkout_url?.includes("demo")) {
        alert(
          `Demo Mode: Would purchase ${plan.credits} credits for ₹${plan.price_inr}\n\nIn production, this would redirect to Razorpay checkout.`
        );
        return;
      }

      // Normal flow: redirect to checkout URL if provided
      if (response?.checkout_url) {
        window.location.href = response.checkout_url;
        return;
      }

      // Fallback: no checkout URL and no explicit error
      setError("Failed to initiate purchase");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err ? String(err) : "Failed to process purchase");
      console.error("Error while initiating purchase:", err);
      setError(msg);
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Balance */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CreditBalance showDetails />
        </div>
        <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Free Tier Always Available
            </h3>
            <p className="text-gray-400 text-sm">
              Every account gets 1,000 free credits every month. No credit card
              required.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Purchase Credits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-colors ${
                plan.id === "pro" ? "ring-2 ring-cyan-500" : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {plan.id === "pro" && (
                    <Badge className="bg-cyan-500">Most Popular</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-white">
                    {plan.credits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </div>
                  <div className="text-gray-400">credits</div>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-cyan-400">
                    ₹{plan.price_inr}
                  </div>
                  <div className="text-gray-400 text-sm">
                    ${plan.price_usd.toFixed(2)} USD
                  </div>
                  <div className="text-green-400 text-sm mt-1">
                    ₹{plan.per_credit}/credit
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                <Button
                  className="w-full"
                  variant={plan.id === "pro" ? "default" : "outline"}
                  onClick={() => purchaseCredits(plan)}
                  disabled={purchasing !== null}
                >
                  {purchasing === plan.id ? "Processing..." : "Buy Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* How it works */}
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle>How Credit Purchases Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-cyan-400 font-bold">1</span>
              </div>
              <h4 className="text-white font-medium mb-2">Select Package</h4>
              <p className="text-gray-400 text-sm">
                Choose the credit package that fits your needs
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-cyan-400 font-bold">2</span>
              </div>
              <h4 className="text-white font-medium mb-2">Pay with Razorpay</h4>
              <p className="text-gray-400 text-sm">
                Secure payment via UPI, Cards, or Net Banking
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-cyan-400 font-bold">3</span>
              </div>
              <h4 className="text-white font-medium mb-2">Instant Credit</h4>
              <p className="text-gray-400 text-sm">
                Credits are added to your account immediately
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-cyan-400 font-bold">4</span>
              </div>
              <h4 className="text-white font-medium mb-2">Use API</h4>
              <p className="text-gray-400 text-sm">
                Each API call deducts 1 credit automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
