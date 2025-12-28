# Frontend Implementation Plan: Missing Features

## 📋 **Overview**

This document provides a complete implementation plan for adding missing frontend features that are currently supported by the backend and SDK but have no UI.

**Status:** Backend ✅ Ready | SDK ✅ Ready | Frontend ❌ Missing

**Target:** Complete frontend-backend alignment for seamless SDK user experience

---

## 🎯 **Features to Implement**

### **Priority 1: Marketplace Vendor Management**
- Vendor list page
- Add new vendor modal
- Vendor details view
- Vendor balance display

### **Priority 2: Subscription Management**
- Subscriptions list page
- Subscription details view
- Action buttons (pause/resume/cancel)
- Plan change modal

### **Priority 3: Enhanced Settings**
- Profile editing
- Notification preferences
- Security settings (2FA)

---

## 📁 **File Structure**

```
frontend/src/
├── app/
│   ├── marketplace/
│   │   └── page.tsx (NEW)
│   ├── subscriptions/
│   │   ├── page.tsx (NEW)
│   │   └── [id]/
│   │       └── page.tsx (NEW)
│   └── settings/
│       └── page.tsx (ENHANCE)
├── components/
│   ├── VendorModal.tsx (NEW)
│   ├── VendorTable.tsx (NEW)
│   ├── SubscriptionCard.tsx (NEW)
│   ├── SubscriptionDetails.tsx (NEW)
│   ├── PlanChangeModal.tsx (NEW)
│   ├── SubscriptionActions.tsx (NEW)
│   └── ProfileSettings.tsx (NEW)
└── lib/
    ├── api-marketplace.ts (NEW)
    ├── api-subscriptions.ts (NEW)
    └── api-settings.ts (NEW)
```

---

## 🚀 **Priority 1: Marketplace Vendor Management**

### **Backend Endpoints Available**

```python
# backend/app/routes/unified_api.py

POST   /v1/marketplace/vendors
# Create a new vendor account
# Request: { vendor_id, name, email, account_details, split_config }
# Response: { vendor_id, status, message }

GET    /v1/marketplace/vendors
# List all vendor accounts
# Response: { vendors: [...] }

# SDK Methods (onerouter-sdk/onerouter/resources/marketplace.py)
client.marketplace.create_vendor(name, email, bank_account)
client.marketplace.get_vendor(vendor_id)
client.marketplace.list_vendors()
client.marketplace.get_vendor_balance(vendor_id)
```

### **Implementation Plan**

#### **Step 1: Create API Client Module**

**File:** `frontend/src/lib/api-marketplace.ts`

```typescript
import { useClientApiCall } from './api-client';

export function useMarketplaceAPI() {
  const apiClient = useClientApiCall();

  return {
    // List all vendors
    listVendors: async () => {
      return apiClient('/v1/marketplace/vendors');
    },

    // Create new vendor
    createVendor: async (vendorData: {
      vendor_id: string;
      name: string;
      email: string;
      account_details: {
        account_number: string;
        ifsc: string;
        beneficiary_name: string;
      };
      split_config: {
        type: 'flat' | 'percentage';
        amount: number;
      };
    }) => {
      return apiClient('/v1/marketplace/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorData)
      });
    },

    // Get vendor balance
    getVendorBalance: async (vendorId: string) => {
      return apiClient(`/v1/marketplace/vendors/${vendorId}/balance`);
    }
  };
}
```

#### **Step 2: Create Vendor Modal Component**

**File:** `frontend/src/components/VendorModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarketplaceAPI } from '@/lib/api-marketplace';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VendorModal({ isOpen, onClose, onSuccess }: VendorModalProps) {
  const [formData, setFormData] = useState({
    vendor_id: '',
    name: '',
    email: '',
    account_number: '',
    ifsc: '',
    beneficiary_name: '',
    split_type: 'flat' as 'flat' | 'percentage',
    split_amount: 0
  });
  const [loading, setLoading] = useState(false);
  const marketplaceAPI = useMarketplaceAPI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await marketplaceAPI.createVendor({
        vendor_id: formData.vendor_id,
        name: formData.name,
        email: formData.email,
        account_details: {
          account_number: formData.account_number,
          ifsc: formData.ifsc,
          beneficiary_name: formData.beneficiary_name
        },
        split_config: {
          type: formData.split_type,
          amount: formData.split_amount
        }
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        vendor_id: '',
        name: '',
        email: '',
        account_number: '',
        ifsc: '',
        beneficiary_name: '',
        split_type: 'flat',
        split_amount: 0
      });
    } catch (error) {
      console.error('Failed to create vendor:', error);
      alert('Failed to create vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#222] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor ID</Label>
              <Input
                id="vendor_id"
                value={formData.vendor_id}
                onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
                placeholder="e.g., vendor_001"
                required
                className="bg-[#0a0a0a] border-[#222]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Acme Store"
                required
                className="bg-[#0a0a0a] border-[#222]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="vendor@example.com"
                required
                className="bg-[#0a0a0a] border-[#222]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                placeholder="1234567890"
                required
                className="bg-[#0a0a0a] border-[#222]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                value={formData.ifsc}
                onChange={(e) => setFormData({...formData, ifsc: e.target.value})}
                placeholder="HDFC0001234"
                required
                className="bg-[#0a0a0a] border-[#222]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
              <Input
                id="beneficiary_name"
                value={formData.beneficiary_name}
                onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})}
                placeholder="John Doe"
                required
                className="bg-[#0a0a0a] border-[#222]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split Configuration</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="split_type">Split Type</Label>
                <select
                  id="split_type"
                  value={formData.split_type}
                  onChange={(e) => setFormData({...formData, split_type: e.target.value as 'flat' | 'percentage'})}
                  className="w-full bg-[#0a0a0a] border-[#222] rounded-md px-3 py-2"
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div className="flex-1">
                <Label htmlFor="split_amount">Amount</Label>
                <Input
                  id="split_amount"
                  type="number"
                  value={formData.split_amount}
                  onChange={(e) => setFormData({...formData, split_amount: parseFloat(e.target.value) || 0})}
                  placeholder="Enter amount"
                  required
                  className="bg-[#0a0a0a] border-[#222]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### **Step 3: Create Marketplace Page**

**File:** `frontend/src/app/marketplace/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Building2, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { FeatureCard } from '@/components/ui/grid-feature-cards';
import { VendorModal } from '@/components/VendorModal';
import { useMarketplaceAPI } from '@/lib/api-marketplace';
import Link from 'next/link';

interface Vendor {
  vendor_id: string;
  name: string;
  email: string;
  account_details: {
    account_number: string;
    ifsc: string;
    beneficiary_name: string;
  };
  split_config: {
    type: 'flat' | 'percentage';
    amount: number;
  };
  created_at: string;
  balance?: {
    available_balance: number;
    pending_balance: number;
    currency: string;
  };
}

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const marketplaceAPI = useMarketplaceAPI();

  useEffect(() => {
    loadVendors();
    loadServices();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.listVendors();
      setVendors(response.vendors || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const apiClient = (await import('@/lib/api-client')).useClientApiCall();
      const response = await apiClient('/api/services');
      setServices(response.services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    }
  };

  const handleVendorCreated = () => {
    loadVendors();
  };

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <header className="border-[#333] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-white/10">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <GlobalEnvironmentToggle services={services} />
                <Link href="/api-keys">
                  <Button className="text-white hover:bg-[#1a1a1a] border-0">
                    Manage API Keys
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
          {/* Overview Metrics */}
          <div className="mb-8">
            <BentoGrid items={[
              {
                title: "Total Vendors",
                meta: `${vendors.length} connected`,
                description: "Vendor accounts configured for split payments",
                icon: <Building2 className="w-4 h-4 text-cyan-500" />,
                status: vendors.length > 0 ? "Active" : "Not Configured",
                tags: ["Marketplace", "Vendors"],
                colSpan: 1,
                hasPersistentHover: true,
              },
              {
                title: "Split Payments",
                meta: "Ready",
                description: "Create multi-vendor payment splits",
                icon: <DollarSign className="w-4 h-4 text-cyan-500" />,
                status: "Available",
                tags: ["Payments", "Marketplace"],
                colSpan: 1,
                hasPersistentHover: true,
              },
            ]} />
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Marketplace Vendors</h1>
              <p className="text-[#888] text-sm mt-1">
                Manage vendor accounts for split payments
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>

          {/* Vendors List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : vendors.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="w-16 h-16 text-[#444] mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Vendors Configured</h3>
                <p className="text-[#888] text-center mb-4">
                  Add your first vendor to start using split payments
                </p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  variant="outline"
                  className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Vendor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <Card key={vendor.vendor_id} className="bg-[#1a1a1a] border-[#222] hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
                        {vendor.split_config.type === 'flat' ? 'Flat' : 'Percentage'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-[#888]">Vendor ID</p>
                      <p className="font-mono text-sm">{vendor.vendor_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#888]">Email</p>
                      <p className="text-sm">{vendor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#888]">Account Details</p>
                      <p className="text-sm font-mono">
                        {vendor.account_details.account_number} ({vendor.account_details.ifsc})
                      </p>
                    </div>
                    {vendor.balance && (
                      <div className="pt-3 border-t border-[#222]">
                        <p className="text-sm text-[#888]">Available Balance</p>
                        <p className="text-lg font-semibold text-cyan-500">
                          {vendor.balance.currency} {vendor.balance.available_balance.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-[#222] flex justify-between items-center">
                      <p className="text-xs text-[#666]">
                        Added {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/marketplace/${vendor.vendor_id}`}
                        className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center"
                      >
                        View Details <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleVendorCreated}
      />
    </DashboardLayout>
  );
}
```

#### **Step 4: Update Navigation**

Add marketplace link to navigation menu in `frontend/src/components/DashboardLayout.tsx`

---

## 🚀 **Priority 2: Subscription Management**

### **Backend Endpoints Available**

```python
# backend/app/routes/unified_api.py

POST   /v1/subscriptions
# Create subscription
# Request: { plan_id, trial_days, quantity, start_date, customer_notify, total_count }
# Response: { subscription_id, status, current_period_start, ... }

GET    /v1/subscriptions/{subscription_id}
# Get subscription details
# Response: { subscription_id, status, plan_id, current_period_end, ... }

POST   /v1/subscriptions/{subscription_id}/pause
# Pause subscription
# Request: { pause_at: "now" | "cycle_end" }

POST   /v1/subscriptions/{subscription_id}/resume
# Resume subscription
# Request: { resume_at: "now" }

POST   /v1/subscriptions/{subscription_id}/cancel
# Cancel subscription
# Request: { cancel_at_cycle_end: boolean }

POST   /v1/subscriptions/{subscription_id}/change_plan
# Change subscription plan
# Request: { new_plan_id: string, prorate: boolean }

# SDK Methods (onerouter-sdk/onerouter/resources/subscriptions.py)
client.subscriptions.create(plan_id, customer_notify, trial_days, ...)
client.subscriptions.get(subscription_id)
client.subscriptions.pause(subscription_id, pause_at)
client.subscriptions.resume(subscription_id, resume_at)
client.subscriptions.cancel(subscription_id, cancel_at_cycle_end)
client.subscriptions.update(subscription_id, plan_id, prorate_behavior)
```

### **Implementation Plan**

#### **Step 1: Create Subscription API Client**

**File:** `frontend/src/lib/api-subscriptions.ts`

```typescript
import { useClientApiCall } from './api-client';

export function useSubscriptionAPI() {
  const apiClient = useClientApiCall();

  return {
    // List all subscriptions
    listSubscriptions: async (params?: { limit?: number; skip?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());

      return apiClient(`/v1/subscriptions?${queryParams.toString()}`);
    },

    // Get subscription details
    getSubscription: async (subscriptionId: string) => {
      return apiClient(`/v1/subscriptions/${subscriptionId}`);
    },

    // Create subscription
    createSubscription: async (data: {
      plan_id: string;
      customer_notify?: boolean;
      total_count?: number;
      quantity?: number;
      trial_days?: number;
      start_date?: string;
    }) => {
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
```

#### **Step 2: Create Subscription Card Component**

**File:** `frontend/src/components/SubscriptionCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, X, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import { useSubscriptionAPI } from '@/lib/api-subscriptions';

interface SubscriptionCardProps {
  subscription: any;
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
                onClick={() => {/* Open plan change modal */}}
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
```

#### **Step 3: Create Subscriptions List Page**

**File:** `frontend/src/app/subscriptions/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Filter } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { FeatureCard } from '@/components/ui/grid-feature-cards';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { useSubscriptionAPI } from '@/lib/api-subscriptions';
import { SubscriptionActions } from '@/components/SubscriptionActions';
import Link from 'next/link';

interface Subscription {
  subscription_id: string;
  plan_id: string;
  status: string;
  customer_id: string;
  amount: number;
  currency: string;
  quantity: number;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_days: number;
  created_at: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [services, setServices] = useState<any[]>([]);
  const subscriptionAPI = useSubscriptionAPI();

  useEffect(() => {
    loadSubscriptions();
    loadServices();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.listSubscriptions({ limit: 50 });
      setSubscriptions(response.subscriptions || []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const apiClient = (await import('@/lib/api-client')).useClientApiCall();
      const response = await apiClient('/api/services');
      setServices(response.services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status?.toLowerCase() === filter;
  });

  const activeCount = subscriptions.filter(s => s.status?.toLowerCase() === 'active').length;
  const pausedCount = subscriptions.filter(s => s.status?.toLowerCase() === 'paused').length;
  const cancelledCount = subscriptions.filter(s => s.status?.toLowerCase() === 'cancelled').length;

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <header className="border-[#333] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-white/10">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <GlobalEnvironmentToggle services={services} />
                <Link href="/api-keys">
                  <Button className="text-white hover:bg-[#1a1a1a] border-0">
                    Manage API Keys
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
          {/* Overview Metrics */}
          <div className="mb-8">
            <BentoGrid items={[
              {
                title: "Active Subscriptions",
                meta: `${activeCount}`,
                description: "Currently active and recurring",
                icon: <Calendar className="w-4 h-4 text-cyan-500" />,
                status: activeCount > 0 ? "Active" : "None",
                tags: ["Subscriptions", "Active"],
                colSpan: 1,
                hasPersistentHover: true,
              },
              {
                title: "Paused",
                meta: `${pausedCount}`,
                description: "Temporarily paused subscriptions",
                icon: <Filter className="w-4 h-4 text-yellow-500" />,
                status: pausedCount > 0 ? "Paused" : "None",
                tags: ["Subscriptions", "Paused"],
                colSpan: 1,
                hasPersistentHover: true,
              },
              {
                title: "Cancelled",
                meta: `${cancelledCount}`,
                description: "Cancelled subscriptions",
                icon: <X className="w-4 h-4 text-red-500" />,
                status: cancelledCount > 0 ? "Cancelled" : "None",
                tags: ["Subscriptions", "Cancelled"],
                colSpan: 2,
                hasPersistentHover: true,
              },
            ]} />
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Subscriptions</h1>
              <p className="text-[#888] text-sm mt-1">
                Manage your recurring subscriptions
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-[#0a0a0a] border-[#222] text-white rounded-md px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="paused">Paused Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>
              <Link href="/subscriptions/create">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Subscription
                </Button>
              </Link>
            </div>
          </div>

          {/* Subscriptions List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#222]">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-[#444] mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Subscriptions Found</h3>
                <p className="text-[#888] text-center mb-4">
                  Create your first subscription or filter by a different status
                </p>
                <Link href="/subscriptions/create">
                  <Button variant="outline" className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Subscription
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.subscription_id}
                  subscription={subscription}
                  onUpdate={loadSubscriptions}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
```

---

## ✅ **Testing Checklist**

### **Marketplace Vendor Management**
- [ ] Can add new vendor
- [ ] Can view vendor list
- [ ] Can see vendor balance
- [ ] Vendor data persists after page refresh
- [ ] Error handling works for invalid data
- [ ] Loading states display correctly

### **Subscription Management**
- [ ] Can view all subscriptions
- [ ] Can filter by status
- [ ] Can pause active subscription
- [ ] Can resume paused subscription
- [ ] Can cancel subscription
- [ ] Can change subscription plan
- [ ] Status updates reflect in UI
- [ ] Error handling works for failed actions
- [ ] Confirm dialogs for destructive actions

---

## 📅 **Implementation Timeline**

### **Day 1: Marketplace Vendor Management**
- Morning: Create API client module
- Morning: Build VendorModal component
- Afternoon: Build marketplace page
- Afternoon: Update navigation
- End of day: Test all vendor features

### **Day 2: Subscription Management**
- Morning: Create subscription API client
- Morning: Build SubscriptionCard component
- Afternoon: Build subscriptions list page
- Afternoon: Build subscription actions
- End of day: Test all subscription features

### **Day 3: Testing & Refinement**
- Morning: Integration testing
- Afternoon: Bug fixes
- Afternoon: Polish UI/UX
- End of day: Final verification

---

## 🎯 **Success Criteria**

1. ✅ All backend endpoints accessible from frontend
2. ✅ No console errors during interactions
3. ✅ Loading states display properly
4. ✅ Error messages are user-friendly
5. ✅ Navigation between pages works
6. ✅ Data persists across page refreshes
7. ✅ Mobile responsive design
8. ✅ Dark theme consistent with existing pages
9. ✅ React Hooks Rules followed (hooks called only at component level)

---

## 📝 **Notes**

- All components should use existing UI components (Card, Button, Badge, etc.)
- Maintain consistent styling with existing pages
- Use the dark theme colors (#1a1a1a, #0a0a0a, #222, cyan-500)
- Follow existing code patterns (hooks, state management, API calls)
- Test both test and live environments
- Ensure CSRF tokens are used for state-changing operations

---

## 🔗 **Related Documentation**

- Backend API: `backend/app/routes/unified_api.py`
- SDK Marketplace: `onerouter-sdk/onerouter/resources/marketplace.py`
- SDK Subscriptions: `onerouter-sdk/onerouter/resources/subscriptions.py`
- Frontend Patterns: `frontend/src/app/api-keys/page.tsx`
- UI Components: `frontend/src/components/ui/`

---

**Document Version:** 1.1
**Created:** 2025-01-XX
**Last Updated:** 2025-01-XX
