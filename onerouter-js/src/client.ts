import { HttpClient } from './http-client';
import * as Types from './types';

export interface OneRouterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export class OneRouter {
  public readonly http: HttpClient;
  public readonly apiKey: string;
  public readonly baseURL: string;

  constructor(config: OneRouterConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseURL = config.baseUrl || 'https://api.onerouter.com';
    this.http = new HttpClient(config);
  }

  // Payments
  readonly payments = {
    create: async (data: Types.PaymentOrderRequest) => {
      return this.http.post<Types.PaymentOrder>('/v1/payments/orders', data);
    },

    get: async (transactionId: string) => {
      return this.http.get<Types.PaymentDetails>(`/v1/payments/orders/${transactionId}`);
    },

    capture: async (transactionId: string) => {
      return this.http.post<Types.PaymentDetails>(`/v1/payments/capture`, { transaction_id: transactionId });
    },

    refund: async (data: Types.RefundRequest) => {
      return this.http.post<Types.RefundResponse>('/v1/payments/refunds', data);
    },
  };

  readonly subscriptions = {
    create: async (data: Types.SubscriptionRequest) => {
      return this.http.post<Types.Subscription>('/v1/subscriptions', data);
    },

    get: async (subscriptionId: string) => {
      return this.http.get<Types.Subscription>(`/v1/subscriptions/${subscriptionId}`);
    },

    cancel: async (subscriptionId: string, cancelAtEndOfCycle = false) => {
      return this.http.post(`/v1/subscriptions/${subscriptionId}/cancel`, { cancel_at_cycle_end: cancelAtEndOfCycle });
    },

    pause: async (subscriptionId: string) => {
      return this.http.post(`/v1/subscriptions/${subscriptionId}/pause`);
    },

    resume: async (subscriptionId: string) => {
      return this.http.post(`/v1/subscriptions/${subscriptionId}/resume`);
    },

    changePlan: async (subscriptionId: string, newPlanId: string) => {
      return this.http.post(`/v1/subscriptions/${subscriptionId}/change-plan`, { new_plan_id: newPlanId });
    },
  };

  readonly paymentLinks = {
    create: async (data: Types.PaymentLinkRequest) => {
      return this.http.post<Types.PaymentLink>('/v1/payment-links', data);
    },
  };

  readonly payouts = {
    create: async (data: any) => {
      return this.http.post('/v1/payouts', data);
    },
  };

  readonly sms = {
    send: async (data: Types.SmsRequest) => {
      return this.http.post<Types.SmsResponse>('/v1/sms', data);
    },
  };

  readonly email = {
    send: async (data: Types.EmailRequest) => {
      return this.http.post<Types.EmailResponse>('/v1/email', data);
    },
  };

  // Utility methods
  async close(): Promise<void> {
    // No-op for fetch-based client
  }

  // Alias for backwards compatibility
  readonly createOrder = this.payments.create;
  readonly getOrder = this.payments.get;
  readonly capturePayment = this.payments.capture;
  readonly refundPayment = this.payments.refund;
  readonly createSubscription = this.subscriptions.create;
  readonly getSubscription = this.subscriptions.get;
  readonly cancelSubscription = this.subscriptions.cancel;
  readonly pauseSubscription = this.subscriptions.pause;
  readonly resumeSubscription = this.subscriptions.resume;
  readonly changeSubscriptionPlan = this.subscriptions.changePlan;
   readonly createPaymentLink = this.paymentLinks.create;
   readonly sendSms = this.sms.send;
   readonly sendEmail = this.email.send;
   readonly createPayout = this.payouts.create;
}