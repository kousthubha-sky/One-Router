import * as React from "react"
import { cn } from "@/lib/utils"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  pauseOnHover?: boolean
  direction?: "left" | "right"
  speed?: number
}

export function Marquee({
  children,
  pauseOnHover = false,
  direction = "left",
  speed = 30,
  className,
  ...props
}: MarqueeProps) {
  const animationStyle: React.CSSProperties = {
    animation: `${direction === "right" ? "marquee-reverse" : "marquee"} ${speed}s linear infinite`,
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden z-10",
        className
      )}
      {...props}
    >
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <div className="relative flex h-24 overflow-hidden">
        <div
          className={cn(
            "flex w-max shrink-0",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          style={animationStyle}
        >
          {children}
          {children}
        </div>
      </div>
    </div>
  )
}
