import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="w-full">
      <div 
        className="min-h-[600px] md:min-h-[700px] relative flex items-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-start space-y-6 max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Your Instant Hub for Data, Airtime, and Bill Payments in Nigeria.
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
                Get the cheapest data plans, top-up any network, pay your KEDCO/DStv
                bills, and more. Fast, automated, and reliable.
              </p>
              <Button size="lg" className="text-base px-8 py-6">
                Get Started Now
              </Button>
              <p className="text-sm md:text-base text-white/80">
                Join 5,000+ satisfied customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}