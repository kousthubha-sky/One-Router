'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, CreditCard, Server, Shield, Search, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

interface ServiceCard {
  name: string;
  category: string;
  subcategory: string;
  features: string[];
  pricing: {
    base?: number;
    unit?: string;
    currency?: string;
  };
}

interface Category {
  name: string;
  icon: string;
  services: ServiceCard[];
}

const CATEGORIES: Record<string, Category> = {
  communications: {
    icon: '💬',
    services: [
      {
        name: 'twilio',
        category: 'communications',
        subcategory: 'sms',
        features: ['send_sms', 'get_sms'],
        pricing: {
          base: 0.0079,
          unit: 'per_message',
          currency: 'USD'
        }
      },
      {
        name: 'resend',
        category: 'communications',
        subcategory: 'email',
        features: ['send_email'],
        pricing: {
          base: 0.0001,
          unit: 'per_email',
          currency: 'USD'
        }
      }
    ],
    name: ''
  },
  payments: {
    icon: '💳',
    services: [
      {
        name: 'razorpay',
        category: 'payments',
        subcategory: 'payment_gateway',
        features: ['create_order', 'capture_payment', 'refund_payment', 'create_subscription'],
        pricing: {
          base: 0.02,
          unit: 'per_transaction',
          currency: 'USD'
        }
      },
      {
        name: 'paypal',
        category: 'payments',
        subcategory: 'payment_gateway',
        features: ['create_order', 'capture_payment', 'refund_payment'],
        pricing: {
          base: 0.03,
          unit: 'per_transaction',
          currency: 'USD'
        }
      }
    ],
    name: ''
  },
  storage: {
    icon: '💾',
    services: [
      {
        name: 'aws_s3',
        category: 'storage',
        subcategory: 'object_storage',
        features: ['upload_file', 'download_file', 'delete_file'],
        pricing: {
          base: 0.023,
          unit: 'per_gb',
          currency: 'USD'
        }
      }
    ],
    name: ''
  },
  auth: {
    icon: '🔐',
    services: [
      {
        name: 'clerk',
        category: 'auth',
        subcategory: 'authentication',
        features: ['signup', 'login', 'password_reset'],
        pricing: {
          base: 0,
          unit: 'per_user',
          currency: 'USD'
        }
      }
    ],
    name: ''
  }
};

export default function ServiceMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [connectedServices, setConnectedServices] = useState<Set<string>>(new Set());

  const getServiceIcon = (serviceName: string): unknown => {
    const iconMap: Record<string, unknown> = {
      twilio: MessageSquare,
      resend: Mail,
      razorpay: CreditCard,
      paypal: CreditCard,
      aws_s3: Server,
      clerk: Shield,
    };
    return iconMap[serviceName] ?? Server;
  };

  const categoryEntries: [string, Category][] = Object.entries(CATEGORIES);

  const { data: connectedServicesData, refetch } = useQuery({
    queryKey: ['connected-services'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        return await response.json();
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    }
  });

  const connectedServices = new Set(connectedServicesData?.services || []);

  const filteredServices = categoryEntries
    .flatMap(([_name, category]) => (selectedCategory === 'all' || category.name === selectedCategory ? category.services : []))
    .filter((service): service is ServiceCard => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        service.name.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower)
      );
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]">
      <div className="border-b border-[#333]">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Service Marketplace
          </h1>
          <p className="text-[#888] text-lg">
            Discover and configure 100+ services through OneRouter
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] w-5 h-5" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#222] border border-[#333] rounded-lg text-white placeholder:text-[#666] focus:outline-none focus:border-[#00A3FF]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-3 bg-[#222] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#00A3FF]"
          >
            <option value="all">All Categories</option>
            {Object.keys(CATEGORIES).map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {categoryEntries.map(([name, category]) => (
            <div
              key={name}
              onClick={() => setSelectedCategory(name)}
              className={`p-6 rounded-lg border cursor-pointer transition-all duration-200
                ${selectedCategory === name
                  ? 'bg-[#00A3FF] border-[#00A3FF]'
                  : 'bg-[#1a1a1a] border-[#333] hover:border-[#666]'
                }`}
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="text-xl font-semibold text-white capitalize mb-2">
                {name}
              </h3>
              <p className="text-[#888] text-sm">
                {category.services.length} service{category.services.length !== 1 ? 's' : ''} available
              </p>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 text-[#666] mx-auto mb-4">🔍</div>
            <p className="text-[#888] text-lg">No services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => {
              const ServiceIcon = getServiceIcon(service.name);
              return (
                <Card key={service.name} className="bg-[#1a1a1a] border-[#333] hover:border-[#00A3FF] transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ServiceIcon className="w-8 h-8 text-[#00A3FF]" />
                        <span className="px-3 py-1 bg-[#222] border border-[#333] rounded-full text-xs text-[#888]">
                          {service.category}
                        </span>
                        {connectedServices.has(service.name) && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await disconnectService(service.name);
                              refetch();
                            }}
                            className="p-1 text-[#666] hover:text-red-400 transition-colors"
                            title="Disconnect service"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    <CardTitle className="text-white capitalize">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="text-[#888]">
                      {service.subcategory}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-[#ccc] mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.features.slice(0, 3).map(feature => (
                          <span
                            key={feature}
                            className="px-2 py-1 bg-[#222] border border-[#333] rounded text-xs text-[#888]"
                          >
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            {formatFeature(feature)}
                          </span>
                        ))}
                        {service.features.length > 3 && (
                          <span className="px-2 py-1 text-xs text-[#666]">
                            +{service.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {service.pricing.base !== undefined && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-[#ccc] mb-2">Pricing:</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">
                            ${service.pricing.base.toFixed(4)}
                          </span>
                          <span className="text-[#888] text-sm">
                            {formatUnit(service.pricing.unit ?? '')}
                          </span>
                        </div>
                      </div>
                    )}

                    <Link href={`/services/${service.name}/configure`}>
                      <Button className="w-full bg-[#00A3FF] hover:bg-[#0082CC] text-white transition-colors">
                        Configure Service
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatFeature(feature: string): string {
  return feature
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function formatUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    per_message: '/ message',
    per_email: '/ email',
    per_transaction: '/ transaction',
    per_gb: '/ GB',
    per_user: '/ user',
  };
  return unitMap[unit] ?? `/${unit}`;
}
