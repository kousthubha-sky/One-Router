"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientApiCall } from "@/lib/api-client";

interface CreditBalanceProps {
  userTier?: "free" | "pro" | "enterprise";
  showDetails?: boolean;
  compact?: boolean;
}

// Pure helper function to map tier to display info
function getTierInfo(userTier: "free" | "pro" | "enterprise") {
  switch (userTier) {
    case "pro":
      return {
        label: "Pro",
        className: "bg-blue-500/10 text-blue-400",
      };
    case "enterprise":
      return {
        label: "Enterprise",
        className: "bg-purple-500/10 text-purple-400",
      };
    case "free":
    default:
      return {
        label: "Free Tier",
        className: "bg-cyan-500/10 text-cyan-400",
      };
  }
}

export function CreditBalance({
  userTier = "free",
  showDetails = false,
  compact = false,
}: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useClientApiCall();

  // Memoized callback for fetching balance (used for retry)
  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient("/v1/credits/balance") as { balance: number; [key: string]: unknown };
      if (response && typeof response.balance === 'number') {
        setBalance(response.balance);
      } else {
        setError("Unable to load credit balance");
        setBalance(null);
      }
    } catch (err) {
      setError("Failed to load balance. Please try again later.");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    // Only fetch once on mount, not on every apiClient change
    let isMounted = true;
    
    const load = async () => {
      const localApiClient = apiClient;
      try {
        setLoading(true);
        setError(null);
        const response = await localApiClient("/v1/credits/balance") as { balance: number; [key: string]: unknown };
        if (isMounted) {
          if (response && typeof response.balance === 'number') {
            setBalance(response.balance);
          } else {
            setError("Unable to load credit balance");
            setBalance(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load balance. Please try again later.");
          setBalance(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const tierInfo = getTierInfo(userTier);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse h-6 w-20 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error && !compact) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-4">
          <div className="text-sm text-red-400 mb-3">{error}</div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchBalance}
            className="text-red-400 border-red-500/50 hover:bg-red-500/20"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Credits:</span>
        <span className="text-cyan-400 font-bold">{balance !== null ? balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "—"}</span>
        {error && <span className="text-xs text-red-400">Error loading</span>}
        <Button size="sm" variant="outline" asChild>
          <a href="/credits">Buy More</a>
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Credit Balance</span>
          <Badge variant="outline" className={tierInfo.className}>
            {tierInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-red-400 mb-4 p-3 bg-red-500/10 rounded border border-red-500/30">
            {error}
          </div>
        ) : null}
        <div className="text-4xl font-bold text-white mb-2">
          {balance !== null ? balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "—"}
        </div>
        <p className="text-gray-400 text-sm mb-4">credits remaining</p>

        {showDetails && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Tier:</span>
              <span className="capitalize">{userTier}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Per API call:</span>
              <span>1 credit</span>
            </div>
          </div>
        )}

        <Button className="w-full mt-4" asChild>
          <a href="/credits">Buy More Credits</a>
        </Button>
      </CardContent>
    </Card>
  );
}
