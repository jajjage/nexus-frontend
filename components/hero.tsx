import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
      <div className="flex flex-col items-start space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Your Instant Hub for Data, Airtime, and Bill Payments in Nigeria.
        </h1>
        <p className="text-lg text-muted-foreground">
          Get the cheapest data plans, top-up any network, pay your KEDCO/DStv
          bills, and more. Fast, automated, and reliable.
        </p>
        <Button size="lg">Get Started Now</Button>
        <p className="text-sm text-muted-foreground">
          Join 5,000+ satisfied customers.
        </p>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative w-64 h-[500px] bg-slate-800 rounded-3xl border-8 border-slate-700 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-slate-900 p-4">
            <div className="text-white text-center font-bold">
              Nexus Data Sub
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-10 bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
