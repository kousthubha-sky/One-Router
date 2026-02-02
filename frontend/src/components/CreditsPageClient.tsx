"use client";

import { useState, useEffect } from "react";
import { useClientApiCall } from "@/lib/api-client";
import {
  RefreshCw,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Clock,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface BalanceData {
  balance: number;
  total_purchased: number;
  total_consumed: number;
  free_tier_estimated_remaining: number;
  recent_transactions: Transaction[];
}

interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price_inr: number;
  price_usd: number;
  per_credit: number;
  description: string;
}

export function CreditsPageClient() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const apiClient = useClientApiCall();

  const ITEMS_PER_PAGE = 5;

  // Convert credits to dollars (adjust rate as needed)
  const toUSD = (credits: number) => (credits * 0.01).toFixed(2);

  useEffect(() => {
    loadBalance();
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const response = (await apiClient("/v1/credits/plans")) as unknown as {
        plans: CreditPlan[];
      };
      setPlans(response.plans || []);
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  }

  async function loadBalance() {
    try {
      setLoading(true);
      const response = (await apiClient("/v1/credits/balance")) as unknown as BalanceData;
      setBalance(response);
    } catch (err) {
      console.error("Failed to load balance:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadBalance();
    setRefreshing(false);
  }

  async function handlePurchase(planId: string) {
    setPurchasing(planId);
    setError(null);

    try {
      const plan = plans.find((p) => p.id === planId);
      const response = (await apiClient("/v1/credits/purchase", {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          credits: plan?.credits || 1000,
          provider: "razorpay",
        }),
      })) as unknown as { checkout_url?: string; error?: string };

      if (response?.error) {
        setError(String(response.error));
        return;
      }

      if (response?.checkout_url?.includes("demo")) {
        // Demo mode - simulate success
        alert(
          `Demo Mode: Would purchase ${plan?.credits || 1000} credits for ₹${plan?.price_inr || 100}`
        );
        await loadBalance();
        return;
      }

      if (response?.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case "consumption":
        return <ArrowDownRight className="w-4 h-4 text-orange-400" />;
      case "bonus":
        return <Gift className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  }

  // Pagination logic
  const transactions = balance?.recent_transactions || [];
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const balanceUSD = balance ? toUSD(balance.balance) : "0.00";

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-white">Credits</h1>
        <button
          onClick={handleRefresh}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800 mb-8" />

      {/* Balance Card */}
      <div className="bg-[#0a0a0a] rounded-xl p-6 mb-6 relative">
        <div className="flex items-baseline">
          <span className="text-gray-400 text-4xl font-light mr-2">$</span>
          <span className="text-white text-5xl font-light">{balanceUSD}</span>
        </div>
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors group">
          <Info className="w-5 h-5" />
          {/* Tooltip */}
          <div className="absolute right-0 top-8 w-64 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Added:</span>
                <span className="text-white">
                  ${toUSD(balance?.total_purchased || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Used:</span>
                <span className="text-white">
                  ${toUSD(balance?.total_consumed || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Free Balance:</span>
                <span className="text-indigo-400">
                  ${toUSD(balance?.free_tier_estimated_remaining || 0)}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Buy Credits Section */}
      <div className="mb-8">
        <h2 className="text-white font-semibold text-lg mb-4">Buy Credits</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#0a0a0a] rounded-xl p-6 border transition-all ${
                plan.id === "pro"
                  ? "border-indigo-500/50 ring-1 ring-indigo-500/20"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              {plan.id === "pro" && (
                <div className="text-xs font-medium text-indigo-400 mb-2">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-white font-semibold text-lg">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-white">
                  ₹{plan.price_inr}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  ({plan.credits.toLocaleString()} credits)
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
              <div className="text-xs text-gray-500 mb-4">
                ₹{plan.per_credit.toFixed(2)} per credit
                {plan.id !== "starter" && (
                  <span className="text-green-400 ml-2">
                    Save{" "}
                    {Math.round(
                      ((0.1 - plan.per_credit) / 0.1) * 100
                    )}
                    %
                  </span>
                )}
              </div>
              <button
                onClick={() => handlePurchase(plan.id)}
                disabled={purchasing !== null}
                className={`w-full font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  plan.id === "pro"
                    ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                } disabled:opacity-50`}
              >
                {purchasing === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Buy Now"
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <a
            href="/analytics"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            View Usage Analytics
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-gray-500">
            Need custom pricing?{" "}
            <a
              href="mailto:sales@onerouter.dev"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Contact Sales
            </a>
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800 mb-6" />

      {/* Recent Transactions */}
      <div className="bg-[#0a0a0a] rounded-xl p-6 border border-[#0a0a0a]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">
            Recent Transactions
          </h2>
          <a
            href="/dashboard/payment-history"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm underline"
          >
            Payment History
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Transactions List */}
        <div className="space-y-1">
          {paginatedTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions yet
            </p>
          ) : (
            paginatedTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between py-4 ${
                  index !== 0 ? "border-t border-[#0a0a0a]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">
                      {formatDate(transaction.created_at)}
                    </span>
                    <p className="text-gray-500 text-xs">
                      {transaction.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-medium ${
                    transaction.amount > 0 ? "text-green-400" : "text-white"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}$
                  {Math.abs(transaction.amount * 0.01).toFixed(2)}
                </span>
                <a
                  href={`/dashboard/invoice/${transaction.id}`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  View Invoice
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 rounded-lg bg-[#2a2a2a] text-white min-w-[40px] text-center">
            {currentPage}
          </span>
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
            }
            className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}