// frontend/src/app/paypal-setup/page.tsx
"use client";

import React, { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PayPalSetup } from "@/components/PayPalSetup";
import { useClientApiCall } from "@/lib/api-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function PayPalSetupContent() {
  const apiClient = useClientApiCall();

  return (
    <DashboardLayout>
      <div className="text-white font-sans border-t border-white/10 min-h-screen">
        <header className="border-[#333] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-white/10">
            <div className="flex items-center gap-4 py-6">
              <Link href="/services" className="hover:opacity-70 transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold">PayPal Configuration</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Set up your sandbox and live PayPal API credentials
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Environment Segregation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <h3 className="font-semibold text-cyan-400 mb-2">Sandbox Environment</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ Use sandbox API credentials</li>
                  <li>✓ No real charges</li>
                  <li>✓ Test buyer accounts available</li>
                  <li>✓ Instant testing</li>
                  <li>✓ api-m.sandbox.paypal.com</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <h3 className="font-semibold text-green-400 mb-2">Live Environment</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ Use live API credentials</li>
                  <li>✓ Real money transactions</li>
                  <li>✓ Full payment methods</li>
                  <li>✓ Settlement processing</li>
                  <li>✓ api-m.paypal.com</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <PayPalSetup apiClient={apiClient} />
          </div>

          <div className="mt-8 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300 text-sm">
            <p className="mb-2 font-semibold">💡 How to get PayPal API Credentials:</p>
            <ol className="space-y-1 ml-4 list-decimal">
              <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">developer.paypal.com</a></li>
              <li>Log in and go to Dashboard → Apps & Credentials</li>
              <li>Create a new app or select existing one</li>
              <li>Copy the Client ID and Secret</li>
              <li>For sandbox: Toggle to &quot;Sandbox&quot; mode</li>
              <li>For live: Toggle to &quot;Live&quot; mode</li>
            </ol>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

export default function PayPalSetupPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      </DashboardLayout>
    }>
      <PayPalSetupContent />
    </Suspense>
  );
}
