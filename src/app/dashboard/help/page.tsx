"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronRight,
  FileQuestion,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import Link from "next/link";

export default function HelpSupportPage() {
  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Start Chat",
      href: "#",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@nexus-data.com",
      action: "Send Email",
      href: "mailto:support@nexus-data.com",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Available 9AM - 6PM",
      action: "Call Now",
      href: "tel:+2349000000000",
    },
  ];

  const faqItems = [
    {
      question: "How do I fund my wallet?",
      href: "#",
    },
    {
      question: "Why is my transaction pending?",
      href: "#",
    },
    {
      question: "How do I reset my PIN?",
      href: "#",
    },
    {
      question: "What is cashback and how do I use it?",
      href: "#",
    },
  ];

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6">
      {/* Page Header */}
      <header className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
          Help & Support
        </h1>
      </header>

      {/* Hero Card */}
      <Card className="from-primary to-primary/80 text-primary-foreground bg-gradient-to-r">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 rounded-full bg-white/20 p-4">
              <Headphones className="size-10" />
            </div>
            <h2 className="text-lg font-semibold">We&apos;re Here to Help</h2>
            <p className="mt-2 text-sm opacity-90">
              Get assistance with your account, transactions, or any issues
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Options */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Contact Us</h2>
        {contactOptions.map((option) => (
          <Card key={option.title} className="overflow-hidden">
            <Link href={option.href}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <option.icon className="text-primary size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{option.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {option.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-5" />
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="size-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqItems.map((faq) => (
            <Link
              key={faq.question}
              href={faq.href}
              className="hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
            >
              <span className="text-sm font-medium">{faq.question}</span>
              <ChevronRight className="text-muted-foreground size-4" />
            </Link>
          ))}
          <Button variant="outline" className="mt-4 w-full">
            View All FAQs
          </Button>
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  );
}
