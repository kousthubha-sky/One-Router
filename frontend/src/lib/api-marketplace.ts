import { useClientApiCall } from './api-client';

export interface Vendor {
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

export interface CreateVendorRequest {
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
}

export function useMarketplaceAPI() {
  const apiClient = useClientApiCall();

  return {
    // List all vendors
    listVendors: async () => {
      const response = await apiClient('/v1/marketplace/vendors');
      return response as { vendors: Vendor[] };
    },

    // Create new vendor
    createVendor: async (vendorData: CreateVendorRequest) => {
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
