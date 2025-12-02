import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="w-full">
      {/* Mobile View */}
      <div className="relative flex min-h-[600px] items-center bg-cover bg-center md:hidden">
        <Image
          src="/images/hero-background.png"
          alt="Hero Background"
          fill
          className="z-0 object-cover"
          priority
        />
        <div className="absolute inset-0 z-1 bg-black/50" />
        <div className="relative z-10 w-full px-4 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="flex flex-col items-start space-y-6">
              <h1 className="text-3xl leading-tight font-bold text-white sm:text-4xl">
                Your Instant Hub for Data, Airtime, and Bill Payments in
                Nigeria.
              </h1>
              <p className="text-base leading-relaxed text-white/90 sm:text-lg">
                Get the cheapest data plans, top-up any network, pay your
                KEDCO/DStv bills, and more. Fast, automated, and reliable.
              </p>
              <Button size="lg" className="px-8 py-6 text-base" asChild>
                <Link href="/register">Get Started Now</Link>
              </Button>
              <p className="text-sm text-white/80">
                Join 5,000+ satisfied customers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="container mx-auto hidden grid-cols-1 items-center gap-8 px-4 py-20 sm:px-6 md:grid md:grid-cols-2 md:py-32 lg:px-8">
        <div className="flex flex-col items-start space-y-6">
          <h1 className="text-foreground text-3xl leading-tight font-bold sm:text-4xl md:text-5xl lg:text-6xl">
            Your Instant Hub for Data, Airtime, and Bill Payments in Nigeria.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed sm:text-lg md:text-xl">
            Get the cheapest data plans, top-up any network, pay your KEDCO/DStv
            bills, and more. Fast, automated, and reliable.
          </p>
          <Button size="lg" className="px-8 py-6 text-base" asChild>
            <Link href="/register">Get Started Now</Link>
          </Button>
          <p className="text-muted-foreground text-sm md:text-base">
            Join 5,000+ satisfied customers.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Image
            src="/images/hero-background.png"
            alt="Hero Image"
            width={600}
            height={600}
            className="h-auto w-full rounded-lg"
            priority
          />
        </div>
      </div>
    </section>
  );
}
