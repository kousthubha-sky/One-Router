'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, DollarSign, Building2, ExternalLink, Loader2,
  Wallet, ChevronRight, ChevronDown, Mail, CreditCard
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { VendorModal } from '@/components/VendorModal';
import { useMarketplaceAPI, Vendor } from '@/lib/api-marketplace';
import { useClientApiCall } from '@/lib/api-client';
import { Pagination } from '@/components/ui/pagination';
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
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
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
  }, []);

  const handleVendorCreated = () => {
    loadVendors();
  };

  const totalBalance = vendors.reduce((acc, v) => acc + (v.balance?.available_balance || 0), 0);

  // Pagination
  const totalPages = Math.ceil(vendors.length / ITEMS_PER_PAGE);
  const paginatedVendors = vendors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10">
        <header className="border-[#333] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-white/10">
            <div className="flex justify-between items-center py-6">
              <GlobalEnvironmentToggle services={services} apiClient={apiClient} />
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-black hover:bg-zinc-200 text-sm h-9"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Metrics */}
          <BentoGrid items={[
            {
              title: "Total Vendors",
              meta: `${vendors.length}`,
              description: "Vendor accounts configured",
              icon: <Building2 className="w-4 h-4 text-cyan-500" />,
              status: vendors.length > 0 ? "Active" : "None",
              tags: ["Marketplace"],
              colSpan: 1,
            },
            {
              title: "Split Payments",
              meta: "Ready",
              description: "Create multi-vendor splits",
              icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
              status: "Available",
              tags: ["Payments"],
              colSpan: 1,
            },
            {
              title: "Total Balance",
              meta: `₹${totalBalance.toFixed(0)}`,
              description: "Combined vendor balances",
              icon: <Wallet className="w-4 h-4 text-blue-500" />,
              status: totalBalance > 0 ? "Active" : "None",
              tags: ["Balance"],
              colSpan: 1,
            },
          ]} />

          {/* Vendors List */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-8">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-3 text-lg">
                  <Building2 className="w-5 h-5 text-cyan-500" />
                  Marketplace Vendors
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                  {vendors.length} vendors
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
                  <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No vendors configured</p>
                  <p className="text-xs text-zinc-600 mt-1 mb-4">Add your first vendor to start using split payments</p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-black hover:border-zinc-600"
                  >
                    <Plus className="w-3 h-3 mr-1.5" />
                    Add First Vendor
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {paginatedVendors.map((vendor) => {
                    const isExpanded = expandedVendor === vendor.vendor_id;
                    return (
                      <div key={vendor.vendor_id} className="border border-zinc-800/50 rounded-lg overflow-hidden">
                        {/* Compact Row */}
                        <button
                          onClick={() => setExpandedVendor(isExpanded ? null : vendor.vendor_id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-500" />
                            )}
                            <span className="text-sm text-white font-medium">{vendor.name}</span>
                            <Badge className="bg-cyan-500/15 text-cyan-400 text-[10px]">
                              {vendor.split_config.type === 'flat' ? 'Flat' : 'Percentage'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            {vendor.balance && (
                              <span className="text-sm text-emerald-400 font-medium">
                                {vendor.balance.currency} {vendor.balance.available_balance.toFixed(0)}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                              {new Date(vendor.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50 bg-zinc-900/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Vendor ID</p>
                                <code className="text-xs text-zinc-300 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                  {vendor.vendor_id}
                                </code>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Email</p>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-zinc-500" />
                                  <span className="text-xs text-zinc-300">{vendor.email}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Account</p>
                                <div className="flex items-center gap-1">
                                  <CreditCard className="w-3 h-3 text-zinc-500" />
                                  <span className="text-xs text-zinc-300 font-mono">
                                    {vendor.account_details.account_number}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">IFSC</p>
                                <span className="text-xs text-zinc-300 font-mono">
                                  {vendor.account_details.ifsc}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500">Split:</span>
                                <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                                  {vendor.split_config.type === 'flat'
                                    ? `₹${vendor.split_config.amount}`
                                    : `${vendor.split_config.amount}%`
                                  }
                                </Badge>
                              </div>
                              <Link
                                href={`/marketplace/${vendor.vendor_id}`}
                                className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
                              >
                                View Details <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={vendors.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
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
