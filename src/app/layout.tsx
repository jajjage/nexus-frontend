import { AuthRedirectLoader } from "@/components/auth-redirect-loader";
import { MarkupSyncer } from "@/components/MarkupSyncer";
import { ServiceWorkerNavigationListener } from "@/components/ServiceWorkerNavigationListener";
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
  icons: {
    icon: "/images/favicon-1.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <AuthRedirectLoader />
              <MarkupSyncer />
              <ServiceWorkerNavigationListener />
              {/* <FcmSyncer /> */}
              <Toaster richColors position="top-right" />
              {children}
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
