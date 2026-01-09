import { MarkupSyncer } from "@/components/MarkupSyncer";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerNavigationListener } from "@/components/ServiceWorkerNavigationListener";
import { NetworkStatusBanner } from "@/components/layout/network-status-banner";
import { SoftLockScreen } from "@/components/pwa/SoftLockScreen";
import { AuthProvider } from "@/context/AuthContext";
import { SoftLockProvider } from "@/context/SoftLockContext";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Nexus Data",
  description:
    "Welcome to Nexus Data - Your Gateway to Seamless Data Management",
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
              </SoftLockProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
