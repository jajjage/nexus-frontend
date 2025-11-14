import { Facebook, Twitter, Instagram } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold">Nexus Data Sub</h3>
            <p className="mt-2 text-sm leading-relaxed">
              Your one-stop shop for data, airtime, and bill payments in
              Nigeria.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href="#" className="hover:text-foreground transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                <Instagram className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#services" className="text-sm hover:text-foreground transition-colors">
                  Buy Data
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-sm hover:text-foreground transition-colors">
                  Airtime Top-up
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-sm hover:text-foreground transition-colors">
                  Pay KEDCO
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-sm hover:text-foreground transition-colors">
                  DStv/GOtv
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-sm hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-foreground transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
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