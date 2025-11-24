"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image"; // Using Next.js Image for optimization

export function PromoBanner() {
  return (
    <Card className="w-full overflow-hidden rounded-2xl bg-blue-100 shadow-sm">
      <CardContent className="relative flex h-36 flex-col justify-center p-6 sm:flex-row sm:items-center">
        {/* Ideally, use an SVG or a well-optimized PNG for the image */}
        <div className="absolute right-0 bottom-0 hidden sm:block">
          <Image
            src="/images/promo-graphic.svg" // Placeholder image path
            alt="Promotional graphic"
            width={150}
            height={150}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div className="z-10">
          <h3 className="text-lg font-bold text-blue-900">
            Unlimited Cashback
          </h3>
          <p className="max-w-xs text-sm text-blue-800">
            Get up to 5% cashback on all your transactions this month!
          </p>
          <Button className="mt-3 bg-blue-600 text-white hover:bg-blue-700">
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
