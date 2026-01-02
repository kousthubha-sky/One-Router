export interface PaymentOrderRequest {
  amount: number;
  currency: string;
  provider?: string;
  method?: string;
  receipt?: string;
  notes?: Record<string, any>;
  idempotency_key?: string;
  upi_app?: string;
  emi_plan?: string;
  card_network?: string;
  wallet_provider?: string;
  bank_code?: string;
}

export interface PaymentOrder {
  transaction_id: string;
  provider: string;
  provider_order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'captured' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  checkout_url?: string;
  receipt?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentDetails {
  transaction_id: string;
  provider: string;
  provider_order_id: string;
  amount: number;
  currency: string;
  status: PaymentOrder['status'];
  created_at: string;
  updated_at?: string;
}

export interface RefundRequest {
  payment_id: string;
  amount?: number;
  reason?: string;
  notes?: string;
}

export interface RefundResponse {
  refund_id: string;
  payment_id: string;
  provider: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface SubscriptionRequest {
  plan_id: string;
  provider?: string;
  customer_notify?: boolean;
  total_count?: number;
  quantity?: number;
  trial_days?: number;
  start_date?: string;
  idempotency_key?: string;
}

export interface Subscription {
  subscription_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'trial';
  current_cycle: number;
  total_cycles?: number;
  created_at: string;
  updated_at?: string;
}

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'weekly';
  trial_days?: number;
}

export interface PaymentLinkRequest {
  amount: number;
  currency?: string;
  description?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  expire_by?: string;
  metadata?: Record<string, string>;
}

export interface PaymentLink {
  link_id: string;
  short_url: string;
  original_url: string;
  amount: number;
  description?: string;
  created_at: string;
}

export interface SmsRequest {
  to: string;
  body: string;
  from_number?: string;
  provider?: string;
  idempotency_key?: string;
}

export interface SmsResponse {
  message_id: string;
  status: string;
  service: string;
  cost: number;
  currency: string;
  created_at?: string;
}

export interface EmailRequest {
  to: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  from_email?: string;
  provider?: string;
  idempotency_key?: string;
}

export interface EmailResponse {
  email_id: string;
  status: string;
  service: string;
  cost: number;
  currency: string;
  created_at?: string;
}

export interface SmsResponse {
  success: boolean;
  message?: string;
}

export interface ApiKey {
  key_name: string;
  key_prefix: string;
  key_hash: string;
  environment: 'test' | 'live';
  rate_limit_per_min: number;
  rate_limit_per_day: number;
  is_active: boolean;
  created_at: string;
}

export interface UsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_amount: number;
  cost_in_currency: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: Record<string, { status: string; last_checked: string }>;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}