'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, User, Mail, CreditCard, Landmark,
  Percent, DollarSign, Loader2, X
} from 'lucide-react';
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
  const [error, setError] = useState('');
  const marketplaceAPI = useMarketplaceAPI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#09090b] border-zinc-800 text-white max-w-lg p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-cyan-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-medium">Add Vendor</DialogTitle>
                <p className="text-xs text-zinc-500">Configure marketplace vendor</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Basic Info</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1.5">Vendor ID</label>
                  <input
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
                    placeholder="vendor_001"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1.5">Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Acme Store"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="vendor@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Bank Details</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1.5">Account Number</label>
                  <input
                    value={formData.account_number}
                    onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                    placeholder="1234567890"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white font-mono placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1.5">IFSC Code</label>
                  <input
                    value={formData.ifsc}
                    onChange={(e) => setFormData({...formData, ifsc: e.target.value.toUpperCase()})}
                    placeholder="HDFC0001234"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white font-mono placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5">Beneficiary Name</label>
                <input
                  value={formData.beneficiary_name}
                  onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})}
                  placeholder="John Doe"
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Split Config */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Split Configuration</span>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, split_type: 'flat'})}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    formData.split_type === 'flat'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-sm">Flat Amount</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, split_type: 'percentage'})}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    formData.split_type === 'percentage'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span className="text-sm">Percentage</span>
                </button>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5">
                  {formData.split_type === 'flat' ? 'Amount (₹)' : 'Percentage (%)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    {formData.split_type === 'flat' ? '₹' : '%'}
                  </span>
                  <input
                    type="number"
                    value={formData.split_amount || ''}
                    onChange={(e) => setFormData({...formData, split_amount: parseFloat(e.target.value) || 0})}
                    placeholder={formData.split_type === 'flat' ? '100' : '10'}
                    required
                    min="0"
                    max={formData.split_type === 'percentage' ? 100 : undefined}
                    className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-4 border-t border-zinc-800 bg-zinc-900/30">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Vendor'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
