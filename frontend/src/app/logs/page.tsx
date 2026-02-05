'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClientApiCall } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, CheckCircle, XCircle, Clock, Search,
  Loader2, Activity, ChevronRight, ChevronDown, Timer
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle';
import { BentoGrid } from '@/components/ui/bento-grid';
import { Pagination } from '@/components/ui/pagination';

interface Transaction {
  id: string;
  transaction_id: string;
  service_name: string;
  endpoint: string;
  http_method: string;
  status: string;
  response_status: number;
  response_time_ms: number;
  created_at: string;
}

interface Service {
  id: string;
  service_name: string;
  environment: string;
}

export default function LogsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const apiClient = useClientApiCall();

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient('/api/analytics/logs?limit=100');
      setTransactions((response as { logs: Transaction[] }).logs || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

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
    loadTransactions();
    loadServices();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.status === filter;
    const matchesSearch = searchTerm === '' ||
      tx.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-500/15 text-emerald-400';
      case 'failed': return 'bg-red-500/15 text-red-400';
      default: return 'bg-blue-500/15 text-blue-400';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-emerald-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-yellow-400';
      case 'DELETE': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const successCount = transactions.filter(tx => tx.status === 'success').length;
  const successRate = transactions.length > 0
    ? Math.round((successCount / transactions.length) * 100)
    : 0;

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

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
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Metrics */}
          <BentoGrid items={[
            {
              title: "Total Requests",
              meta: `${transactions.length}`,
              description: "API calls logged",
              icon: <Activity className="w-4 h-4 text-cyan-500" />,
              status: transactions.length > 0 ? "Active" : "None",
              tags: ["Logs"],
              colSpan: 1,
            },
            {
              title: "Success Rate",
              meta: `${successRate}%`,
              description: `${successCount} successful requests`,
              icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
              status: successRate >= 90 ? "Healthy" : successRate >= 70 ? "Warning" : "Critical",
              tags: ["Performance"],
              colSpan: 1,
            },
            {
              title: "Failed Requests",
              meta: `${transactions.filter(tx => tx.status === 'failed').length}`,
              description: "Requests that failed",
              icon: <XCircle className="w-4 h-4 text-red-500" />,
              status: "Tracked",
              tags: ["Errors"],
              colSpan: 1,
            },
          ]} />

          {/* Filters */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-8">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID or service..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:border-zinc-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-1.5">
                  {['all', 'success', 'failed', 'pending'].map((status) => (
                    <Button
                      key={status}
                      onClick={() => setFilter(status)}
                      variant="outline"
                      size="sm"
                      className={`h-9 text-xs ${
                        filter === status
                          ? 'bg-white text-black border-white hover:bg-zinc-200'
                          : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-black hover:border-zinc-700'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Logs */}
          <Card className="bg-[#09090b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-3 text-lg">
                  <FileText className="w-5 h-5 text-cyan-500" />
                  Transaction Logs
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                  {filteredTransactions.length} transactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
                  <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No transactions found</p>
                  <p className="text-xs text-zinc-600 mt-1">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {paginatedTransactions.map((tx) => {
                    const isExpanded = expandedLog === tx.id;
                    return (
                      <div key={tx.id} className="border border-zinc-800/50 rounded-lg overflow-hidden">
                        {/* Compact Row */}
                        <button
                          onClick={() => setExpandedLog(isExpanded ? null : tx.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-500" />
                            )}
                            <Badge className={`${getStatusColor(tx.status)} text-[10px]`}>
                              {tx.status}
                            </Badge>
                            <span className={`text-xs font-mono font-medium ${getMethodColor(tx.http_method)}`}>
                              {tx.http_method}
                            </span>
                            <code className="text-sm text-zinc-300 truncate max-w-[200px]">
                              {tx.endpoint}
                            </code>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                              {tx.service_name}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Timer className="w-3 h-3" />
                              {tx.response_time_ms}ms
                            </div>
                            <span className="text-[10px] text-zinc-600">
                              {new Date(tx.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50 bg-zinc-900/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Transaction ID</p>
                                <code className="text-xs text-zinc-300 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                  {tx.transaction_id}
                                </code>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Response Status</p>
                                <span className="text-xs text-zinc-300">{tx.response_status}</span>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Response Time</p>
                                <span className="text-xs text-zinc-300">{tx.response_time_ms}ms</span>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Timestamp</p>
                                <span className="text-xs text-zinc-300">
                                  {new Date(tx.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredTransactions.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
}
