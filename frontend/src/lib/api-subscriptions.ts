import { useClientApiCall } from './api-client';

export interface Subscription {
  // Razorpay format
  id: string;
  subscription_id?: string; // Alias for backwards compatibility
  plan_id: string;
  status: string;
  customer_id?: string | null;
  customer_email?: string | null;
  customer_contact?: string | null;
  quantity?: number;
  current_start?: number; // Unix timestamp
  current_end?: number; // Unix timestamp
  charge_at?: number; // Unix timestamp
  short_url?: string;
  paid_count?: number;
  remaining_count?: number;
  total_count?: number;
  created_at: number; // Unix timestamp
  // OneRouter additions
  provider?: string;
  environment?: string;
  // Legacy fields
  amount?: number;
  currency?: string;
  billing_cycle?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_days?: number;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  customer_notify?: boolean;
  total_count?: number;
  quantity?: number;
  trial_days?: number;
  start_date?: string;
}

export function useSubscriptionAPI() {
  const apiClient = useClientApiCall();

  return {
    // Get subscription details (individual)
    getSubscription: async (subscriptionId: string) => {
      return apiClient(`/v1/subscriptions/${subscriptionId}`);
    },

    // Create subscription
    createSubscription: async (data: CreateSubscriptionRequest) => {
      return apiClient('/v1/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    // Pause subscription
    pauseSubscription: async (subscriptionId: string, pauseAt: 'now' | 'cycle_end' = 'now') => {
      return apiClient(`/v1/subscriptions/${subscriptionId}/pause`, {
        method: 'POST',
        body: JSON.stringify({ pause_at: pauseAt })
      });
    },

    // Resume subscription
    resumeSubscription: async (subscriptionId: string, resumeAt: 'now' = 'now') => {
      return apiClient(`/v1/subscriptions/${subscriptionId}/resume`, {
        method: 'POST',
        body: JSON.stringify({ resume_at: resumeAt })
      });
    },

    // Cancel subscription
    cancelSubscription: async (subscriptionId: string, cancelAtCycleEnd: boolean = false) => {
      return apiClient(`/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd })
      });
    },

    // Change plan
    changePlan: async (subscriptionId: string, newPlanId: string, prorate: boolean = true) => {
      return apiClient(`/v1/subscriptions/${subscriptionId}/change_plan`, {
        method: 'POST',
        body: JSON.stringify({
          new_plan_id: newPlanId,
          prorate: prorate
        })
      });
    }
  };
}
