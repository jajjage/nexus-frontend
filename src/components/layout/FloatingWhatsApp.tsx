"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export function FloatingWhatsApp() {
  const pathname = usePathname();

  // Ensure it doesn't show up in the admin dashboard (as admins don't need to text customer support)
  if (pathname?.startsWith("/admin")) return null;

  // Using environment variable with a safe fallback
  const supportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347033776056";
  const defaultMessage = encodeURIComponent(
    "Hello Nexus Data Support! 👋\n\nI am reaching out from your website and I need some assistance with..."
  );

  const whatsappUrl = `https://wa.me/${supportNumber}?text=${defaultMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed right-6 bottom-24 z-[50] flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600 active:scale-95 md:bottom-8"
      aria-label="Contact Support on WhatsApp"
      title="Chat with Customer Service"
    >
      <MessageCircle className="h-7 w-7" />

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute top-1/2 right-full mr-4 -translate-y-1/2 rounded-md bg-black/80 px-3 py-1.5 text-sm whitespace-nowrap text-white opacity-0 transition-opacity duration-300 md:group-hover:opacity-100">
        Chat with Support
        <div className="absolute top-1/2 right-[-4px] -translate-y-1/2 border-4 border-transparent border-l-black/80"></div>
      </div>
    </a>
  );
}
