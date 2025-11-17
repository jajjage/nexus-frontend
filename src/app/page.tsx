import { Header } from "@/components/landing-page/header";
import { Hero } from "@/components/landing-page/hero";
import { Services } from "@/components/landing-page/services";
import { Pricing } from "@/components/landing-page/pricing";
import { HowItWorks } from "@/components/landing-page/how-it-works";
import { BetterTogether } from "@/components/landing-page/better-together";
import { FAQ } from "@/components/landing-page/faq";
import { Footer } from "@/components/landing-page/footer";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <main className="w-full">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Services />
          <Pricing />
          <HowItWorks />
          <BetterTogether />
          <FAQ />
        </div>
      </main>
      <Footer />
    </>
  );
}
