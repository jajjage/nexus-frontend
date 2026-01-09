import { MarkupSyncer } from "@/components/MarkupSyncer";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerNavigationListener } from "@/components/ServiceWorkerNavigationListener";
import { NetworkStatusBanner } from "@/components/layout/network-status-banner";
import { AuthProvider } from "@/context/AuthContext";
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
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Nexus Data",
    "theme-color": "#000000",
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
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Nexus Data" />
        {/* Inline splash screen styles for instant PWA cold start feedback */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            #pwa-splash {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #fff;
              color: #000;
            }
            @media (prefers-color-scheme: dark) {
              #pwa-splash {
                background: #000;
                color: #fff;
              }
            }
            #pwa-splash.hidden { display: none; }
            #pwa-splash img { width: 100px; height: 100px; animation: pulse 2s infinite; }
            #pwa-splash h1 {
              font-size: 1.5rem;
              margin-top: 1rem;
              font-weight: bold;
              color: inherit;
            }
            #pwa-splash .spinner {
              width: 32px; height: 32px; margin-top: 1.5rem;
              border: 3px solid rgba(128,128,128,0.2);
              border-top-color: currentColor;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
          `,
          }}
        />
      </head>
      <body className="antialiased">
        {/* PWA Splash Screen - Shows immediately, hidden when app loads */}
        <div id="pwa-splash">
          <img src="/images/splash-icon-light.png" alt="Nexus Data" />
          <h1>Nexus Data</h1>
          <div className="spinner" />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Hide splash when DOM is ready
            if (document.readyState === 'complete') {
              document.getElementById('pwa-splash')?.classList.add('hidden');
            } else {
              window.addEventListener('load', function() {
                setTimeout(function() {
                  document.getElementById('pwa-splash')?.classList.add('hidden');
                }, 300);
              });
            }
          `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div data-app-root>
                <NetworkStatusBanner />
                <MarkupSyncer />
                <ServiceWorkerNavigationListener />
                <PWAInstallPrompt />
                {/* <FcmSyncer /> */}
                <Toaster richColors position="top-right" />
                {children}
              </div>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
