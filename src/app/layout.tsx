import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ToastContainer from "@/components/Toast";
import NavigationLoading from "@/components/NavigationLoading";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://axia.co.tz'),
  title: {
    default: "Axia HR Advisory - Leading HR Solutions & Recruitment Services in Tanzania",
    template: "%s | Axia HR Advisory"
  },
  description: "Axia HR Advisory provides comprehensive HR solutions, recruitment services, and career opportunities in Tanzania. Connect with top employers, find your dream job, and access professional HR consulting services.",
  keywords: [
    "HR Advisory Tanzania",
    "Recruitment Services Tanzania",
    "Job Portal Tanzania",
    "HR Consulting",
    "Career Opportunities Tanzania",
    "Talent Acquisition",
    "HR Solutions",
    "Job Search Tanzania",
    "Professional Recruitment",
    "HR Services Dar es Salaam"
  ],
  authors: [{ name: "Axia HR Advisory" }],
  creator: "Axia HR Advisory",
  publisher: "Axia HR Advisory",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://axia.co.tz",
    siteName: "Axia HR Advisory",
    title: "Axia HR Advisory - Leading HR Solutions & Recruitment Services in Tanzania",
    description: "Comprehensive HR solutions, recruitment services, and career opportunities in Tanzania. Connect with top employers and find your dream job.",
    images: [
      {
        url: "/favicon.jpeg",
        width: 1200,
        height: 630,
        alt: "Axia HR Advisory Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axia HR Advisory - Leading HR Solutions & Recruitment Services",
    description: "Comprehensive HR solutions, recruitment services, and career opportunities in Tanzania.",
    images: ["/favicon.jpeg"],
    creator: "@axiahr",
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
    icon: [
      { url: "/favicon.jpeg", type: "image/jpeg" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicon.jpeg", type: "image/jpeg" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  verification: {
    // Add Google Search Console verification if needed
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable} ${outfit.variable} antialiased`}
      >
        <GlobalErrorHandler />
        <ToastContainer />
        <Suspense fallback={null}>
          <NavigationLoading />
        </Suspense>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
