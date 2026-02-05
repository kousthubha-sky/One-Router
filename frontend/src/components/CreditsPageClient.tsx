"use client";

import { useState, useEffect } from "react";
import { useClientApiCall } from "@/lib/api-client";
import {
  RefreshCw,
  Info,
  ExternalLink,
  Loader2,
  CreditCard,
  IndianRupee,
  DollarSign,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export function CreditsPageClient() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<"INR" | "USD">("INR");
  const [purchaseAmount, setPurchaseAmount] = useState<string>("10");
  const [autoTopUp, setAutoTopUp] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const apiClient = useClientApiCall();

  // Exchange rate (should match backend CreditPricingService.USD_TO_INR)
  const USD_TO_INR = 86;

  // Balance is stored in smallest unit (cents/paise), convert to display
  const toDisplayAmount = (amount: number, currency: "INR" | "USD" = "USD") => {
    return (amount * 0.01).toFixed(2);
  };

  useEffect(() => {
    loadBalance();
  }, []);

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

  async function handlePurchase(amount: number, currency: "INR" | "USD") {
    setPurchasing(true);
    setError(null);

    try {
      const provider = currency === "USD" ? "dodo" : "razorpay";
      // Backend expects the monetary amount directly (e.g., 10 for $10)
      // The backend will calculate credits from this

      const response = (await apiClient("/v1/credits/purchase", {
        method: "POST",
        body: JSON.stringify({
          credits: amount,
          currency: currency,
          provider: provider,
        }),
      })) as unknown as { checkout_url?: string; error?: string };

      if (response?.error) {
        setError(String(response.error));
        return;
      }

      if (response?.checkout_url?.includes("demo")) {
        const symbol = currency === "USD" ? "$" : "₹";
        alert(`Demo Mode: Added ${symbol}${amount.toFixed(2)} to your balance`);
        setShowPurchaseModal(false);
        await loadBalance();
        return;
      }

      if (response?.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const balanceDisplay = balance ? toDisplayAmount(balance.balance) : "0.00";
  const numAmount = parseFloat(purchaseAmount) || 0;
  const currencySymbol = paymentCurrency === "USD" ? "$" : "₹";
  const taxRate = paymentCurrency === "USD" ? 0.07 : 0.18;
  const usdEquivalent = paymentCurrency === "INR" ? numAmount / USD_TO_INR : numAmount;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Credits</h1>
        <button
          onClick={handleRefresh}
          className="text-gray-400 hover:text-white transition-colors p-2"
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Balance Card */}
      <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-400 text-sm mb-1">Current Balance</div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">
                  ${balanceDisplay}
                </span>
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  ${toDisplayAmount(balance?.free_tier_estimated_remaining || 0)} free
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                ≈ {balance?.balance?.toLocaleString() || 0} credits
              </p>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm mb-1">Total Added</div>
              <div className="text-xl font-semibold text-white">
                ${toDisplayAmount(balance?.total_purchased || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPurchaseModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-[#0a0a0a] border border-gray-800 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowPurchaseModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-white mb-6">Add Credits</h2>

            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Amount</label>
                <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 border border-gray-700 focus-within:border-gray-500">
                  <span className="text-gray-400 text-2xl mr-2">{currencySymbol}</span>
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="10"
                    min="1"
                    step="0.01"
                    className="bg-transparent text-white text-3xl font-semibold w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Currency Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentCurrency("INR")}
                  className={`flex-1 py-2.5 px-3 rounded border text-sm transition-all ${
                    paymentCurrency === "INR"
                      ? "border-green-500 bg-green-500/15 text-green-300 font-medium"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>INR</span>
                  </div>
                  <div className="text-xs opacity-70 mt-0.5">Razorpay</div>
                </button>
                <button
                  onClick={() => setPaymentCurrency("USD")}
                  className={`flex-1 py-2.5 px-3 rounded border text-sm transition-all ${
                    paymentCurrency === "USD"
                      ? "border-blue-500 bg-blue-500/15 text-blue-300 font-medium"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>USD</span>
                  </div>
                  <div className="text-xs opacity-70 mt-0.5">Dodo</div>
                </button>
              </div>

              {/* Summary */}
              <div className="bg-gray-800/40 rounded-lg p-3 text-sm space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{numAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Est. Tax ({(taxRate * 100).toFixed(0)}%)</span>
                  <span>{currencySymbol}{(numAmount * taxRate).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between text-white font-semibold">
                  <span>Total</span>
                  <span>{currencySymbol}{(numAmount * (1 + taxRate)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400 text-xs">
                  <span>Balance added (USD)</span>
                  <span>+${usdEquivalent.toFixed(2)}</span>
                </div>
                {paymentCurrency === "INR" && (
                  <p className="text-gray-500 text-xs">Exchange rate: ₹{USD_TO_INR} = $1</p>
                )}
              </div>

              {/* Purchase Button */}
              <Button
                className="w-full bg-indigo-500 hover:bg-indigo-600 h-11 text-sm font-medium"
                disabled={purchasing || numAmount <= 0}
                onClick={() => handlePurchase(numAmount, paymentCurrency)}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Credits Overview */}
        <div className="lg:col-span-2">
          {/* Add Credits Button Card */}
          <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium mb-1">Need more credits?</h3>
                  <p className="text-gray-400 text-sm">Top up your balance with INR or USD</p>
                </div>
                <Button
                  onClick={() => setShowPurchaseModal(true)}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credits
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/analytics"
                  className="flex-1 flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white">View Usage</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </a>

                <a
                  href="mailto:sales@onerouter.dev"
                  className="flex-1 flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white">Need Invoicing?</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-[#0a0a0a] border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balance?.recent_transactions?.slice(0, 3).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div>
                      <div className="text-gray-400 text-sm">
                        {formatDate(transaction.created_at)}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {transaction.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.amount > 0 ? "text-green-400" : "text-white"
                      }`}>
                        {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount * 0.01).toFixed(2)}
                      </div>
                      <a
                        href={`/dashboard/invoice/${transaction.id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                      >
                        View Invoice
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
                {(!balance?.recent_transactions || balance.recent_transactions.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Auto Top-Up */}
        <div>
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Auto Top-Up</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Automatically recharge your balance when it reaches a minimum threshold.
                </p>
                
                {autoTopUp ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm font-medium">Enabled</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Recharge: $50 when balance drops below $10
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-sm">Not configured</p>
                  </div>
                )}

                <Button 
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                  onClick={() => setAutoTopUp(!autoTopUp)}
                >
                  {autoTopUp ? "Disable" : "Enable"} Auto Top-Up
                </Button>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-400 text-xs">
                      Auto top-up requires a valid payment method on file
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

