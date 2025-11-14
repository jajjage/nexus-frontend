"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="flex items-center flex-shrink-0">
          <Link href="/" className="font-bold text-base sm:text-lg">
            Nexus Data Sub
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center px-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="#services" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Services
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="#pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="#about" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    About Us
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="#faq" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    FAQs
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
          <Button variant="ghost">Login</Button>
          <Button>Create Account</Button>
        </div>

        <div className="md:hidden flex-shrink-0">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] px-6">
              <nav className="flex flex-col space-y-6 mt-8">
                <Link 
                  href="/" 
                  className="font-bold text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Nexus Data Sub
                </Link>
                <Link 
                  href="#services" 
                  className="text-base hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Services
                </Link>
                <Link 
                  href="#pricing" 
                  className="text-base hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="#about" 
                  className="text-base hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  About Us
                </Link>
                <Link 
                  href="#faq" 
                  className="text-base hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  FAQs
                </Link>
                <div className="flex flex-col space-y-3 pt-6 border-t">
                  <Button variant="ghost" className="w-full">Login</Button>
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