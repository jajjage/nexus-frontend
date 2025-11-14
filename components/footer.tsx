import { Facebook, Twitter, Instagram } from "lucide-react";
import Link from "next/link";

const servicesLinks = [
  { href: "#services", label: "Buy Data" },
  { href: "#services", label: "Airtime Top-up" },
  { href: "#services", label: "Pay KEDCO" },
  { href: "#services", label: "DStv/GOtv" },
];

const companyLinks = [
  { href: "#about", label: "About Us" },
  { href: "#", label: "Contact Support" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Privacy Policy" },
];

export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold">Nexus Data Sub</h3>
            <p className="mt-2 text-sm leading-relaxed">
              Your one-stop shop for data, airtime, and bill payments in
              Nigeria.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                <Facebook className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                <Twitter className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                <Instagram className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Services</h4>
            <ul className="space-y-2">
              {servicesLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm">
          <p>© 2025 Nexus Data Sub. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
