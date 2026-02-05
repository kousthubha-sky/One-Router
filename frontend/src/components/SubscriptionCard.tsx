'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, X, ExternalLink, Calendar, User, CreditCard } from 'lucide-react';
import { useSubscriptionAPI, Subscription } from '@/lib/api-subscriptions';

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdate: () => void;
}

export function SubscriptionCard({ subscription, onUpdate }: SubscriptionCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const subscriptionAPI = useSubscriptionAPI();

  const subId = subscription.id || subscription.subscription_id || '';

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'paused': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
      case 'cancelled':
      case 'canceled': return 'bg-red-500/15 text-red-400 border-red-500/20';
      case 'created': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'pending': return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
      default: return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePause = async () => {
    setLoading('pause');
    try {
      await subscriptionAPI.pauseSubscription(subId);
      onUpdate();
    } catch (error) {
      console.error('Failed to pause:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleResume = async () => {
    setLoading('resume');
    try {
      await subscriptionAPI.resumeSubscription(subId);
      onUpdate();
    } catch (error) {
      console.error('Failed to resume:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this subscription?')) return;
    setLoading('cancel');
    try {
      await subscriptionAPI.cancelSubscription(subId, true);
      onUpdate();
    } catch (error) {
      console.error('Failed to cancel:', error);
    } finally {
      setLoading(null);
    }
  };

  const isActive = subscription.status?.toLowerCase() === 'active';
  const isPaused = subscription.status?.toLowerCase() === 'paused';
  const isCreated = subscription.status?.toLowerCase() === 'created';
  const isCancelled = ['cancelled', 'canceled'].includes(subscription.status?.toLowerCase() || '');

  return (
    <Card className="bg-[#09090b] border-zinc-800/50 hover:border-zinc-700 transition-all">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(subscription.status)}>
              {subscription.status}
            </Badge>
            {subscription.environment && (
              <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                {subscription.environment}
              </Badge>
            )}
          </div>
          {subscription.short_url && (
            <a
              href={subscription.short_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Main Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">ID:</span>
            <code className="text-xs text-zinc-300 bg-zinc-800/50 px-1.5 py-0.5 rounded font-mono">
              {subId.slice(0, 20)}...
            </code>
          </div>

          {(subscription.customer_email || subscription.customer_contact) && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-300">
                {subscription.customer_email || subscription.customer_contact || 'No customer'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-300">
              {subscription.paid_count || 0} paid / {subscription.total_count || 0} total
            </span>
          </div>

          {subscription.current_end && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500">Next charge:</span>
              <span className="text-zinc-300">{formatDate(subscription.current_end)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isCancelled && !isCreated && (
          <div className="flex gap-2 pt-3 border-t border-zinc-800">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={loading === 'pause'}
                className="flex-1 h-8 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
              >
                <Pause className="w-3 h-3 mr-1.5" />
                {loading === 'pause' ? 'Pausing...' : 'Pause'}
              </Button>
            )}

            {isPaused && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={loading === 'resume'}
                className="flex-1 h-8 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              >
                <Play className="w-3 h-3 mr-1.5" />
                {loading === 'resume' ? 'Resuming...' : 'Resume'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading === 'cancel'}
              className="flex-1 h-8 text-xs bg-transparent border-zinc-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
            >
              <X className="w-3 h-3 mr-1.5" />
              {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </Button>
          </div>
        )}

        {isCreated && (
          <div className="pt-3 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-600 text-center">
              Pending activation - waiting for first payment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
