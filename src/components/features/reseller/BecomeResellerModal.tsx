"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/context/AuthContext";
import { useRequestResellerUpgrade } from "@/hooks/useReseller";
import {
  BadgePercent,
  CheckCircle2,
  Code2,
  Headphones,
  Loader2,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";

interface BecomeResellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  {
    icon: BadgePercent,
    title: "Massive Discounts",
    description: "Get up to 10% OFF on data and airtime bundles",
  },
  {
    icon: Users,
    title: "Bulk Tools",
    description: "Send credit to 50+ numbers at once with Batch Top-up",
  },
  {
    icon: Code2,
    title: "API Access",
    description: "Integrate our services into your own website or app",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "Get a dedicated account manager for your business",
  },
];

export function BecomeResellerModal({
  open,
  onOpenChange,
}: BecomeResellerModalProps) {
  const { user } = useAuthContext();
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate: submitRequest, isPending } = useRequestResellerUpgrade();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    submitRequest(message, {
      onSuccess: () => {
        setIsSubmitted(true);
        setMessage("");
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setIsSubmitted(false);
      setMessage("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {isSubmitted ? (
          // Success State
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl">
              Application Submitted!
            </DialogTitle>
            <DialogDescription className="max-w-sm">
              Thank you for your interest! Our team will review your application
              and contact you within 24-48 hours.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-4">
              Got it
            </Button>
          </div>
        ) : (
          // Form State
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-xl">
                Unlock Exclusive Wholesale Rates
              </DialogTitle>
              <DialogDescription>
                Turn your network into net worth. Join the Nexus Data Reseller
                program today!
              </DialogDescription>
            </DialogHeader>

            {/* Benefits Grid */}
            <div className="my-4 grid grid-cols-2 gap-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-muted/50 rounded-lg border p-3"
                >
                  <benefit.icon className="text-primary mb-2 h-5 w-5" />
                  <p className="text-sm font-medium">{benefit.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Info (Read-only) */}
              <div className="bg-muted/30 rounded-lg border p-3">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-muted-foreground text-xs">
                  {user?.email} • {user?.phoneNumber}
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm leading-none font-medium"
                >
                  Tell us about your business
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., I run a cyber cafe in Lagos and do about ₦50k daily volume..."
                  rows={4}
                  required
                  disabled={isPending}
                />
                <p className="text-muted-foreground text-xs">
                  Describe your business and why you'd like reseller access
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={!message.trim() || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
