import { AirtimePlans } from "@/components/features/dashboard/airtime/airtime-plans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AirtimePage() {
  return (
    <div className="flex min-h-screen flex-col p-4 pb-20">
      <div className="mb-2 flex items-center">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="size-6" />
          </Link>
        </Button>
      </div>

      <AirtimePlans />
    </div>
  );
}
