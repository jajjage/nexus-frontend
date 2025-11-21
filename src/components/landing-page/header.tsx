"use client";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About Us" },
    { href: "#faq", label: "FAQs" },
  ];

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="flex h-16 items-center justify-between px-2 md:px-3 lg:px-4">
        <div className="flex shrink-0 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.svg"
              alt="Nexus Data Sub"
              width={40}
              height={40}
              className="h-8 w-8"
            />
            <span className="hidden text-base font-bold sm:block sm:text-lg">
              Nexus Data Sub
            </span>
          </Link>
        </div>

        <div className="hidden flex-1 justify-center px-4 md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={link.href}
                      className={navigationMenuTriggerStyle()}
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden shrink-0 items-center space-x-2 md:flex">
          <Button variant="ghost">Login</Button>
          <Button>Create Account</Button>
        </div>

        <div className="z-50 flex shrink-0 items-center md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative z-50 h-10 w-10 p-2"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] px-6 sm:w-[320px]">
              <nav className="mt-8 flex flex-col space-y-6">
                <SheetTitle>
                  <Link
                    href="/"
                    className="text-lg font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image
                      src="/images/logo.svg"
                      alt="Nexus Data Sub"
                      width={32}
                      height={32}
                    />
                  </Link>
                </SheetTitle>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:text-primary py-2 text-base transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col space-y-3 border-t pt-6">
                  <Button variant="ghost" className="w-full">
                    Login
                  </Button>
                  <Button className="w-full">Create Account</Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
