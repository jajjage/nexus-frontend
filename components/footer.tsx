import { Facebook, Twitter, Instagram } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold">Nexus Data Sub</h3>
            <p className="mt-2 text-sm">
              Your one-stop shop for data, airtime, and bill payments in
              Nigeria.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href="#">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#">
                <Instagram className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Services</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="#services">Buy Data</Link>
              </li>
              <li>
                <Link href="#services">Airtime Top-up</Link>
              </li>
              <li>
                <Link href="#services">Pay KEDCO</Link>
              </li>
              <li>
                <Link href="#services">DStv/GOtv</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="#about">About Us</Link>
              </li>
              <li>
                <Link href="#">Contact Support</Link>
              </li>
              <li>
                <Link href="#">Terms of Service</Link>
              </li>
              <li>
                <Link href="#">Privacy Policy</Link>
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
