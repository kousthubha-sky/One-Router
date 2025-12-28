'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarketplaceAPI, CreateVendorRequest } from '@/lib/api-marketplace';

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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="split_type" className="text-sm">Split Type</Label>
                <select
                  id="split_type"
                  value={formData.split_type}
                  onChange={(e) => setFormData({...formData, split_type: e.target.value as 'flat' | 'percentage'})}
                  className="w-full bg-[#0a0a0a] border-[#222] rounded-md px-3 py-2 text-white"
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="split_amount" className="text-sm">Amount</Label>
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
              className="border-[#333] hover:bg-[#222]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600">
              {loading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
