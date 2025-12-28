'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, X, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import { useSubscriptionAPI, Subscription } from '@/lib/api-subscriptions';

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdate: () => void;
}

export function SubscriptionCard({ subscription, onUpdate }: SubscriptionCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const subscriptionAPI = useSubscriptionAPI();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    }
  };

  const handlePause = async () => {
    setLoading('pause');
    try {
      await subscriptionAPI.pauseSubscription(subscription.subscription_id);
      onUpdate();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
      alert('Failed to pause subscription');
    } finally {
      setLoading(null);
    }
  };

  const handleResume = async () => {
    setLoading('resume');
    try {
      await subscriptionAPI.resumeSubscription(subscription.subscription_id);
      onUpdate();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      alert('Failed to resume subscription');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    const cancelAtEnd = confirm('Cancel at end of billing cycle?');
    setLoading('cancel');
    try {
      await subscriptionAPI.cancelSubscription(subscription.subscription_id, cancelAtEnd);
      onUpdate();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setLoading(null);
    }
  };

  const isActive = subscription.status?.toLowerCase() === 'active';
  const isPaused = subscription.status?.toLowerCase() === 'paused';
  const isCancelled = subscription.status?.toLowerCase() === 'cancelled';

  return (
    <Card className="bg-[#1a1a1a] border-[#222] hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{subscription.plan_id}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(subscription.status)}>
                {subscription.status}
              </Badge>
              {subscription.trial_days && subscription.trial_days > 0 && (
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                  Trial: {subscription.trial_days} days
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-cyan-500">
              {subscription.currency} {subscription.amount?.toFixed(2)}
            </p>
            {subscription.billing_cycle && (
              <p className="text-xs text-[#888]">/{subscription.billing_cycle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[#888]">Customer ID</p>
            <p className="font-mono text-sm">{subscription.customer_id}</p>
          </div>
          <div>
            <p className="text-sm text-[#888]">Quantity</p>
            <p className="text-sm">{subscription.quantity || 1}</p>
          </div>
        </div>

        {subscription.current_period_end && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#888]" />
            <span className="text-[#888]">Renews: </span>
            <span className="font-medium">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-[#222] flex gap-2">
          {isActive && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={loading === 'pause'}
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-2" />
                {loading === 'pause' ? 'Pausing...' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {  /* Open plan change modal */}}
                disabled={loading !== null}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Change Plan
              </Button>
            </>
          )}

          {isPaused && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={loading === 'resume'}
              className="flex-1 bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading === 'resume' ? 'Resuming...' : 'Resume'}
            </Button>
          )}

          {!isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading === 'cancel'}
              className="flex-1 text-red-500 hover:bg-red-500/10 border-red-500/30"
            >
              <X className="w-4 h-4 mr-2" />
              {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
