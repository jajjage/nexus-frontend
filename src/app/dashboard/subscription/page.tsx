import { DataPlans } from "@/components/features/dashboard/data/data-plans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SubscriptionPage() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="p-4 pb-0">
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            Subscriptions
          </h1>
        </header>
      </div>

      <DataPlans
        productType="subscription"
        title="Subscriptions"
        returnUrl="/dashboard/subscription"
      />
    </div>
  );
}
