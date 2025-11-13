import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { Pricing } from "@/components/pricing";
import { HowItWorks } from "@/components/how-it-works";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <Header />
      <Hero />
      <Services />
      <Pricing />
      <HowItWorks />
      <FAQ />
      <Footer />
    </main>
  );
}