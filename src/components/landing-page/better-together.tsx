import Image from "next/image";

export function BetterTogether() {
  return (
    <section id="better-together" className="container mx-auto py-20 md:py-32">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col items-start space-y-6">
          <h2 className="text-foreground text-3xl leading-tight font-bold sm:text-4xl">
            Better Together, Worldwide
          </h2>
          <p className="text-muted-foreground text-lg">
            Our platform is designed to connect you with your loved ones and
            services, no matter where you are in the world. Experience seamless
            transactions and reliable service, all in one place.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Image
            src="/images/world.png"
            alt="World"
            width={500}
            height={500}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
