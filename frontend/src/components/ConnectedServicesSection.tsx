"use client"

import { motion } from "framer-motion"
import { Pencil, LinkIcon, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditServiceModal } from "@/components/EditServiceModal"

interface Service {
  id: string
  service_name: string
  environment: string
  features: Record<string, boolean>
  credential_hint?: string
}

interface ConnectedServicesSectionProps {
  services: Service[]
}

// Service Logo Renderer - Uses PNG images from /public
function ServiceLogo({ serviceName }: { serviceName: string }) {
  const lowerServiceName = serviceName.toLowerCase().trim()

  // Map service names to their PNG logo files
  const logoMap: Record<string, string> = {
    razorpay: "/razorpay.png",
    paypal: "/paypal.png",
    twilio: "/twilio.png",
    resend: "/resend.png",
  }

  const serviceColors: Record<string, { bg: string; text: string }> = {
    razorpay: { bg: "bg-blue-500/20", text: "text-blue-400" },
    paypal: { bg: "bg-blue-600/20", text: "text-blue-300" },
    twilio: { bg: "bg-red-500/20", text: "text-red-400" },
    resend: { bg: "bg-pink-500/20", text: "text-pink-400" },
  }

  const logoPath = logoMap[lowerServiceName]
  const colors = serviceColors[lowerServiceName] || { bg: "bg-cyan-500/20", text: "text-cyan-500" }

  if (logoPath) {
    return (
      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300 overflow-hidden">
        <Image
          src={logoPath}
          alt={serviceName}
          width={40}
          height={40}
          className="w-full h-full object-contain p-1"
        />
      </div>
    )
  }

  // Fallback to colored badge with service initials
  return (
    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300`}>
      <span className={`${colors.text} font-bold text-xs`}>
        {serviceName.slice(0, 2).toUpperCase()}
      </span>
    </div>
  )
}

export function ConnectedServicesSection({ services }: ConnectedServicesSectionProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto border border-cyan-500/20 transition-all duration-300 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20">
          <LinkIcon className="w-12 h-12 text-cyan-500" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-3">No services connected yet</h3>
        <p className="text-[#888] mb-8 max-w-lg mx-auto text-lg leading-relaxed">
          Connect your first payment service to start processing payments securely
        </p>
        <Link href="/onboarding">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 px-10 py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-105 text-lg font-medium">
            <Sparkles className="w-5 h-5 mr-2" />
            Connect Services
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-1 gap-3">
        {services.map((service: Service, index: number) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-2xl border bg-[#0F0F0F] border-white/5 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group [mask-image:linear-gradient(to_bottom,transparent,black_50%,black_95%,transparent)] [mask-size:100%_100%]"
          >
            {/* Service Logo */}
            <div className="shrink-0">
              <ServiceLogo serviceName={service.service_name} />
            </div>

            {/* Service Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold leading-tight truncate mb-1 text-gray-100 capitalize">
                {service.service_name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-2 py-0.5 ${
                    service.environment === 'live'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  {service.environment.toUpperCase()}
                </Badge>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Active</span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="shrink-0">
              <EditServiceModal
                service={service}
                trigger={
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#333] transition-all duration-300 hover:scale-110"
                    title="Edit service credentials"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="w-4 h-4 text-gray-500 hover:text-cyan-400" />
                  </button>
                }
              />
            </div>
          </motion.div>
        ))}

        {/* Add Service Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: services.length * 0.1 }}
          className="mt-4"
        >
          <Link href="/onboarding" className="w-full block">
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-[#333] bg-transparent text-gray-500 hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all duration-300 group">
              <div className="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-all duration-300">
                <span className="text-cyan-500 text-sm font-semibold">+</span>
              </div>
              <span className="text-sm font-medium">Add More Services</span>
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
