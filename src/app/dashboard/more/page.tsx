"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Rocket, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export default function MoreServicesPage() {
  const upcomingFeatures = [
    {
      title: "Utility Payments",
      description:
        "Pay for electricity, water, and other utility bills instantly.",
      icon: Zap,
    },
    {
      title: "Cable TV Subscription",
      description:
        "Renew your DSTV, GOtv, and StarTimes subscriptions with ease.",
      icon: Rocket,
    },
    {
      title: "Educational Pins",
      description: "Purchase WAEC, NECO, and JAMB result checker pins.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-xl font-bold">More Services</h1>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Rocket className="size-6" />
          </div>
          <CardTitle className="text-2xl">Coming Soon!</CardTitle>
          <CardDescription>
            We are working hard to bring you more amazing services. Stay tuned!
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              What to expect:
            </h3>
            <div className="grid gap-4">
              {upcomingFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="hover:bg-muted/50 flex items-start gap-4 rounded-xl border p-4 transition-colors"
                >
                  <div className="bg-primary/5 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <feature.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="leading-none font-medium">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm italic">
              "Our mission is to simplify your digital payments. We're
              constantly expanding our catalog to serve you better."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
