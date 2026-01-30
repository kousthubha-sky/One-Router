// frontend/src/app/resend-setup/page.tsx
"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ResendSetup } from "@/components/ResendSetup";
import { useClientApiCall } from "@/lib/api-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResendSetupPage() {
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
                <h1 className="text-3xl font-bold">Resend Configuration</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Set up your test and live Resend email credentials
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
                <h3 className="font-semibold text-pink-400 mb-2">Test Environment</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>&#10003; Use API key from Resend</li>
                  <li>&#10003; Unverified domains: owner only</li>
                  <li>&#10003; Use onboarding@resend.dev</li>
                  <li>&#10003; 100 emails/day free tier</li>
                  <li>&#10003; Rate limit: 10/sec</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <h3 className="font-semibold text-green-400 mb-2">Live Environment</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>&#10003; Use verified domain</li>
                  <li>&#10003; Real email delivery</li>
                  <li>&#10003; Your custom from address</li>
                  <li>&#10003; Pay per email sent</li>
                  <li>&#10003; Higher rate limits</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <ResendSetup apiClient={apiClient} />
          </div>

          <div className="mt-8 p-4 bg-pink-900/30 border border-pink-700 rounded-lg text-pink-300 text-sm">
            <p className="mb-2 font-semibold">Tips:</p>
            <ul className="space-y-1 ml-4">
              <li>&bull; Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">Resend Dashboard</a></li>
              <li>&bull; For testing, use the default from address: onboarding@resend.dev</li>
              <li>&bull; Verify your domain in Resend before going live</li>
              <li>&bull; Keep your API key secure - never share it publicly</li>
            </ul>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
