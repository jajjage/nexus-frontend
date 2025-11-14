import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="w-full">
      <div className="bg-center-right relative flex min-h-[600px] items-center bg-[url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80)] bg-cover md:min-h-[700px]">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative w-full px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex max-w-xl flex-col items-start space-y-6">
              <h1 className="text-3xl leading-tight font-bold text-white sm:text-4xl md:text-5xl lg:text-6xl">
                Your Instant Hub for Data, Airtime, and Bill Payments in
                Nigeria.
              </h1>
              <p className="text-base leading-relaxed text-white/90 sm:text-lg md:text-xl">
                Get the cheapest data plans, top-up any network, pay your
                KEDCO/DStv bills, and more. Fast, automated, and reliable.
              </p>
              <Button size="lg" className="px-8 py-6 text-base">
                Get Started Now
              </Button>
              <p className="text-sm text-white/80 md:text-base">
                Join 5,000+ satisfied customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
