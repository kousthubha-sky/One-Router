import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

// Suppress Clerk hydration warnings during build
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OneRouter - One API for Payments, SMS & Email",
    template: "%s | OneRouter",
  },
  description:
    "Stop juggling multiple SDKs. Connect Razorpay, PayPal, Twilio & Resend with one integration. Ship faster with a unified API.",
  keywords: [
    "payment gateway",
    "unified API",
    "Razorpay",
    "PayPal",
    "Twilio",
    "Resend",
    "SMS API",
    "Email API",
    "payment integration",
    "developer tools",
  ],
  authors: [{ name: "OneRouter" }],
  creator: "OneRouter",
  metadataBase: new URL("https://onerouter.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://onerouter.dev",
    siteName: "OneRouter",
    title: "OneRouter - One API for Payments, SMS & Email",
    description:
      "Stop juggling multiple SDKs. Connect Razorpay, PayPal, Twilio & Resend with one integration. Ship faster with a unified API.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OneRouter - Unified API for Payments, SMS & Email",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneRouter - One API for Payments, SMS & Email",
    description:
      "Stop juggling multiple SDKs. Connect Razorpay, PayPal, Twilio & Resend with one integration.",
    images: ["/og-image.png"],
    creator: "@onerouter",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY ?? ""} key={"initial"}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
