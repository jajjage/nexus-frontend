import { SmilePlans } from "@/components/features/dashboard/smile/smile-plans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SmilePage() {
  return (
    <div className="flex min-h-screen flex-col p-4 pb-20">
      <div className="mb-2 flex items-center">
        {/* Page Header */}
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Smile & 4G Plans</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
            Smile & 4G Plans
          </h1>
        </header>
      </div>

      <SmilePlans />
    </div>
  );
}
