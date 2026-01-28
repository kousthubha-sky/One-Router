"use client"

import { motion } from "framer-motion"
import { Pencil, LinkIcon, Sparkles } from "lucide-react"
import Link from "next/link"
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

// SVG Logo Components
const RazorpayLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#1F51FF"/>
    <path d="M14 8C14 6.9 14.9 6 16 6C17.1 6 18 6.9 18 8V16C18 17.1 17.1 18 16 18C14.9 18 14 17.1 14 16M10 8C10 6.9 10.9 6 12 6C13.1 6 14 6.9 14 8V12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12V8Z" fill="white"/>
    <path d="M6 10C5.4 10 5 10.4 5 11C5 11.6 5.4 12 6 12H8C8.6 12 9 11.6 9 11C9 10.4 8.6 10 8 10H6Z" fill="white"/>
  </svg>
)

const PayPalLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path d="M9 2C5.14 2 2 5.14 2 9V15C2 18.86 5.14 22 9 22H15C18.86 22 22 18.86 22 15V9C22 5.14 18.86 2 15 2H9Z" fill="#003087"/>
    <path d="M8.5 8.5C8.5 7.95 8.95 7.5 9.5 7.5H12.5C14.43 7.5 15.5 8.57 15.5 10C15.5 11.43 14.43 12.5 12.5 12.5H10.5V14.5C10.5 15.05 10.05 15.5 9.5 15.5C8.95 15.5 8.5 15.05 8.5 14.5V8.5Z" fill="white"/>
    <path d="M10.5 10C10.5 10.55 10.95 11 11.5 11H12C12.83 11 13.5 10.33 13.5 9.5C13.5 8.67 12.83 8 12 8H11.5C10.95 8 10.5 8.45 10.5 9V10Z" fill="#003087"/>
  </svg>
)

const TwilioLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#F22F46"/>
    <circle cx="7" cy="8" r="2" fill="white"/>
    <circle cx="12" cy="8" r="2" fill="white"/>
    <circle cx="17" cy="8" r="2" fill="white"/>
    <circle cx="7" cy="12" r="2" fill="white"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
    <circle cx="17" cy="12" r="2" fill="white"/>
    <circle cx="7" cy="16" r="2" fill="white"/>
    <circle cx="12" cy="16" r="2" fill="white"/>
    <circle cx="17" cy="16" r="2" fill="white"/>
  </svg>
)

const ResendLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#000"/>
    <path d="M3 6L12 11L21 6M3 6V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20H19C19.5304 20 20.0391 19.7893 20.4142 19.4142C20.7893 19.0391 21 18.5304 21 18V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MailgunLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#FF5000"/>
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="white"/>
    <path d="M14 8L10 11L6 8V14C6 14.55 6.45 15 7 15H17C17.55 15 18 14.55 18 14V8L14 11V8Z" fill="#FF5000"/>
  </svg>
)

const SendGridLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#0099D8"/>
    <path d="M6 8L12 5L18 8V16L12 19L6 16V8Z" fill="white"/>
    <path d="M12 10V14M8 11.5V14.5M16 11.5V14.5" stroke="#0099D8" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const SquareLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#3D3D3D"/>
    <rect x="4" y="4" width="16" height="16" rx="2" fill="white"/>
    <path d="M9 9H15V15H9V9Z" fill="#3D3D3D"/>
  </svg>
)

const AWSLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#FF9900"/>
    <path d="M6 9C6 9 7 8 9 8C11 8 11.5 9 12 9.5C12.5 9 13 8 15 8C17 8 18 9 18 9M8 12C8 12 8 13 8 14C8 15 8.5 16 9.5 16C10.5 16 11 15 11 14V12M13 12C13 12 13 13 13 14C13 15 13.5 16 14.5 16C15.5 16 16 15 16 14V12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const WiseLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#00B9FF"/>
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#00B9FF"/>
    <path d="M12 5C8.14 5 5 8.14 5 12C5 15.86 8.14 19 12 19C15.86 19 19 15.86 19 12C19 8.14 15.86 5 12 5ZM12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7Z" fill="white"/>
  </svg>
)

// Service Logo Renderer
function ServiceLogo({ serviceName }: { serviceName: string }) {
  const lowerServiceName = serviceName.toLowerCase().trim()

  const logoMap: Record<string, React.ReactNode> = {
    razorpay: <RazorpayLogo />,
    paypal: <PayPalLogo />,
    twilio: <TwilioLogo />,
    resend: <ResendLogo />,
    mailgun: <MailgunLogo />,
    sendgrid: <SendGridLogo />,
    square: <SquareLogo />,
    aws: <AWSLogo />,
    wise: <WiseLogo />,
  }

  const serviceColors: Record<string, { bg: string; text: string }> = {
    razorpay: { bg: "bg-blue-500/20", text: "text-blue-400" },
    paypal: { bg: "bg-blue-600/20", text: "text-blue-300" },
    twilio: { bg: "bg-red-500/20", text: "text-red-400" },
    resend: { bg: "bg-pink-500/20", text: "text-pink-400" },
    mailgun: { bg: "bg-orange-500/20", text: "text-orange-400" },
    sendgrid: { bg: "bg-blue-400/20", text: "text-blue-300" },
    aws: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    square: { bg: "bg-gray-500/20", text: "text-gray-400" },
    wise: { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  }

  const logo = logoMap[lowerServiceName]
  const colors = serviceColors[lowerServiceName] || { bg: "bg-cyan-500/20", text: "text-cyan-500" }

  if (logo) {
    return (
      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300">
        {logo}
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
