'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Building2, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { VendorModal } from '@/components/VendorModal';
import { useMarketplaceAPI, Vendor } from '@/lib/api-marketplace';
import { useClientApiCall } from '@/lib/api-client';
import Link from 'next/link';

interface Service {
  id: string;
  service_name: string;
  environment: string;
}

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const marketplaceAPI = useMarketplaceAPI();
  const apiClient = useClientApiCall();

  const loadVendors = useCallback(async () => {
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
  }, [marketplaceAPI]);

  const loadServices = useCallback(async () => {
    try {
      const response = await apiClient('/api/services');
      setServices((response as { services: Service[] }).services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    }
  }, [apiClient]);

  useEffect(() => {
    loadVendors();
    loadServices();
  }, [loadVendors, loadServices]);

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
