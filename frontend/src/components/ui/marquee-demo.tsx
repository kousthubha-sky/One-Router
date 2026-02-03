import Image from "next/image"
import { Marquee } from "@/components/ui/marquee"

const services = [
  { name: "Razorpay", src: "/razorpay.png" },
  { name: "PayPal", src: "/paypal.png" },
  { name: "Twilio", src: "/twilio.png" },
  { name: "Resend", src: "/resend.png" },
] as const;

export function MarqueeDemo() {
  return (
    <Marquee speed={20} pauseOnHover>
      {services.map((service) => (
        <div
          key={service.name}
          className="relative h-24 w-48 mx-12 flex items-center justify-center"
        >
          <Image
            src={service.src}
            alt={service.name}
            width={160}
            height={80}
            className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      ))}
    </Marquee>
  )
}
