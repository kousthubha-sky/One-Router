"use client"

import { motion } from "framer-motion"
import { ToggleLeft, Zap } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface Service {
  id: string
  service_name: string
  environment: string
  features: Record<string, boolean>
  credential_hint?: string
}

interface ServiceModesOverviewProps {
  services: Service[]
}

// Services that require separate test/live credentials
const ENVIRONMENT_BASED_SERVICES = ["razorpay", "paypal", "twilio"]

// Services with unified credentials (no test/live split)
const UNIFIED_SERVICES = ["resend"]

// Service metadata for display
const SERVICE_INFO: Record<string, { name: string; logo: string; color: string }> = {
  razorpay: { name: "Razorpay", logo: "/razorpay.png", color: "blue" },
  paypal: { name: "PayPal", logo: "/paypal.png", color: "blue" },
  twilio: { name: "Twilio", logo: "/twilio.png", color: "red" },
  resend: { name: "Resend", logo: "/resend.png", color: "pink" },
}

function ServiceMiniCard({ service }: { service: Service }) {
  const info = SERVICE_INFO[service.service_name.toLowerCase()] || {
    name: service.service_name,
    logo: "",
    color: "gray"
  }
  const isUnified = UNIFIED_SERVICES.includes(service.service_name.toLowerCase())

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
      {info.logo ? (
        <div className="w-6 h-6 rounded overflow-hidden bg-white/10 flex items-center justify-center">
          <Image
            src={info.logo}
            alt={info.name}
            width={24}
            height={24}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-400">
            {info.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-xs font-medium text-gray-300">{info.name}</span>
      {isUnified ? (
        <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-400 border-purple-500/30">
          UNIFIED
        </Badge>
      ) : (
        <Badge className={`ml-auto text-[10px] px-1.5 py-0 ${
          service.environment === 'live'
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        }`}>
          {service.environment.toUpperCase()}
        </Badge>
      )}
    </div>
  )
}

export function ServiceModesOverview({ services }: ServiceModesOverviewProps) {
  // Categorize connected services
  const environmentServices = services.filter(s =>
    ENVIRONMENT_BASED_SERVICES.includes(s.service_name.toLowerCase())
  )
  const unifiedServices = services.filter(s =>
    UNIFIED_SERVICES.includes(s.service_name.toLowerCase())
  )

  // Don't render if no services
  if (services.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test / Live Mode Services */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <ToggleLeft className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Test / Live Mode</h4>
              <p className="text-[10px] text-gray-500">Separate credentials per environment</p>
            </div>
          </div>

          <div className="space-y-2">
            {environmentServices.length > 0 ? (
              environmentServices.map(service => (
                <ServiceMiniCard key={service.id} service={service} />
              ))
            ) : (
              <p className="text-xs text-gray-600 italic py-2">
                No environment-based services connected
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-[10px] text-gray-600">
              Razorpay, PayPal, Twilio require separate test and live API keys
            </p>
          </div>
        </div>

        {/* Unified Services */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Unified Services</h4>
              <p className="text-[10px] text-gray-500">Single API key for all environments</p>
            </div>
          </div>

          <div className="space-y-2">
            {unifiedServices.length > 0 ? (
              unifiedServices.map(service => (
                <ServiceMiniCard key={service.id} service={service} />
              ))
            ) : (
              <p className="text-xs text-gray-600 italic py-2">
                No unified services connected
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-[10px] text-gray-600">
              Test mode via sandbox addresses (e.g., onboarding@resend.dev)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
