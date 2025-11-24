"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ads = [
  {
    title: "Save & Secure",
    description: "Enjoy up to 15% interest on your savings.",
    bgColor: "bg-teal-500",
    buttonText: "Start Saving",
  },
  {
    title: "Get a Loan",
    description: "Instant loans with zero collateral.",
    bgColor: "bg-indigo-500",
    buttonText: "Apply Now",
  },
  {
    title: "Invite Friends",
    description: "Earn ₦500 for every friend you refer.",
    bgColor: "bg-amber-500",
    buttonText: "Refer Now",
  },
];

export function AdsCarousel() {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {ads.map((ad, index) => (
          <CarouselItem key={index}>
            <Card className={`overflow-hidden ${ad.bgColor}`}>
              <CardContent className="flex h-32 flex-col justify-between p-4 text-white">
                <div>
                  <h3 className="text-lg font-bold">{ad.title}</h3>
                  <p className="text-xs">{ad.description}</p>
                </div>
                <Button
                  size="sm"
                  className="w-fit bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                >
                  {ad.buttonText}
                </Button>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Optional: Add Previous/Next buttons if needed */}
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>
  );
}
