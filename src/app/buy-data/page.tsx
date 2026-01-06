import { PublicProductGrid } from "@/components/features/public/public-product-grid";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wifi } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Buy Data | Nexus",
  description:
    "Purchase affordable data bundles for all Nigerian networks. MTN, Airtel, Glo, 9mobile data plans at the best rates.",
};

export default function BuyDataPage() {
  return (
    <div className="from-background to-muted/30 min-h-screen bg-gradient-to-b">
      {/* Hero Section */}
      <section className="bg-background border-b px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 mb-4 rounded-full p-4">
              <Wifi className="text-primary h-10 w-10" />
            </div>
            <h1 className="mb-3 text-3xl font-bold md:text-4xl">Buy Data</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Get affordable data bundles for all Nigerian networks. Instant
              delivery, best rates guaranteed.
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-4 py-8 md:py-12">
        <div className="container mx-auto max-w-6xl">
          <PublicProductGrid productType="data" title="Data Plans" />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 border-t px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            Why Choose Nexus?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-background rounded-xl p-6 text-center shadow-sm">
              <div className="bg-primary/10 mx-auto mb-4 w-fit rounded-full p-3">
                <ArrowRight className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Instant Delivery</h3>
              <p className="text-muted-foreground text-sm">
                Data is credited to your line within seconds
              </p>
            </div>
            <div className="bg-background rounded-xl p-6 text-center shadow-sm">
              <div className="bg-primary/10 mx-auto mb-4 w-fit rounded-full p-3">
                <Wifi className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">All Networks</h3>
              <p className="text-muted-foreground text-sm">
                MTN, Airtel, Glo, and 9Mobile supported
              </p>
            </div>
            <div className="bg-background rounded-xl p-6 text-center shadow-sm">
              <div className="bg-primary/10 mx-auto mb-4 w-fit rounded-full p-3">
                <span className="text-primary text-xl font-bold">₦</span>
              </div>
              <h3 className="mb-2 font-semibold">Best Rates</h3>
              <p className="text-muted-foreground text-sm">
                Competitive pricing with cashback rewards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-semibold">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Create a free account and start enjoying instant data top-ups.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
