// frontend/src/app/twilio-setup/page.tsx
"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { TwilioSetup } from "@/components/TwilioSetup";
import { useClientApiCall } from "@/lib/api-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TwilioSetupPage() {
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
                <h1 className="text-3xl font-bold">Twilio Configuration</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Set up your test and live Twilio SMS credentials
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
                <h3 className="font-semibold text-cyan-400 mb-2">Test Environment</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>&#10003; Use test credentials from Console</li>
                  <li>&#10003; No real SMS charges</li>
                  <li>&#10003; Magic number: +15005550006</li>
                  <li>&#10003; Simulated delivery</li>
                  <li>&#10003; Rate limit: 1000/min</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <h3 className="font-semibold text-green-400 mb-2">Live Environment</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>&#10003; Use live credentials</li>
                  <li>&#10003; Real SMS delivery</li>
                  <li>&#10003; Your Twilio phone number</li>
                  <li>&#10003; Actual carrier charges</li>
                  <li>&#10003; Rate limit: 100/min</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <TwilioSetup apiClient={apiClient} />
          </div>

          <div className="mt-8 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300 text-sm">
            <p className="mb-2 font-semibold">Tips:</p>
            <ul className="space-y-1 ml-4">
              <li>&bull; Find credentials in <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Twilio Console</a></li>
              <li>&bull; Test credentials are separate from live - check the "Test Credentials" section</li>
              <li>&bull; Use magic number +15005550006 for sending test SMS without charges</li>
              <li>&bull; Keep your Auth Token secure - never share it publicly</li>
            </ul>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
