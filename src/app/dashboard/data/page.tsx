import { DataPlans } from "@/components/features/dashboard/data/data-plans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DataPage() {
  return (
    <div className="flex min-h-screen flex-col p-4 pb-20">
      <div className="mb-2 flex items-center">
        {/* Page Header */}
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Data Plans</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
            Data Plans
          </h1>
        </header>
      </div>

      <DataPlans />
    </div>
  );
}
