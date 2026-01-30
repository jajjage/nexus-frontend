import { MarkupSyncer } from "@/components/MarkupSyncer";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerNavigationListener } from "@/components/ServiceWorkerNavigationListener";
import { NetworkStatusBanner } from "@/components/layout/network-status-banner";
import { SoftLockScreen } from "@/components/pwa/SoftLockScreen";
// import { HealthMonitor } from "@/components/HealthMonitor";
import { AuthProvider } from "@/context/AuthContext";
import { SoftLockProvider } from "@/context/SoftLockContext";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexus Data - Best Cheap Data & Airtime VTU Platform in Nigeria",
    template: "%s | Nexus Data",
  },
  description:
    "Buy cheap data bundles, airtime, and pay bills instantly with Nexus Data. Nigeria's most reliable VTU platform with instant delivery, best prices, and 24/7 support.",
  keywords: [
    "cheap data",
    "vtu nigeria",
    "buy airtime",
    "data bundle",
    "mtn data",
    "glo data",
    "airtel data",
    "9mobile data",
    "cheap airtime nigeria",
    "data reseller",
    "bill payment",
    "nexus data",
  ],
  authors: [{ name: "Nexus Data" }],
  creator: "Nexus Data",
  publisher: "Nexus Data",
  metadataBase: new URL("https://nexusdatasub.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://nexusdatasub.com",
    siteName: "Nexus Data",
    title: "Nexus Data - Best Cheap Data & Airtime VTU Platform in Nigeria",
    description:
      "Buy cheap data bundles, airtime, and pay bills instantly. Nigeria's most reliable VTU platform.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexus Data - VTU Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Data - Best Cheap Data & Airtime VTU Platform",
    description:
      "Buy cheap data bundles, airtime, and pay bills instantly with Nexus Data.",
    images: ["/images/og-image.png"],
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus Data",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/favicon-1.svg",
    apple: "/images/ios-light.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Nexus Data",
    "theme-color": "#ffffff",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* Dynamic theme-color based on system preference */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#09090b"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nexus Data" />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <SoftLockProvider>
                {/* <HealthMonitor> */}
                <div data-app-root>
                  <NetworkStatusBanner />
                  <MarkupSyncer />
                  <ServiceWorkerNavigationListener />
                  <PWAInstallPrompt />
                  {/* <FcmSyncer /> */}
                  <Toaster richColors position="top-right" />
                  <SoftLockScreen />
                  {children}
                </div>
                {/* </HealthMonitor> */}
              </SoftLockProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
