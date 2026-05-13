import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Tv, Zap } from "lucide-react";
import Link from "next/link";

const billOptions = [
  {
    title: "Electricity",
    description: "Pay prepaid and postpaid meter bills.",
    href: "/dashboard/electricity",
    icon: Zap,
  },
  {
    title: "Cable TV",
    description: "Renew or change cable subscriptions.",
    href: "/dashboard/cable",
    icon: Tv,
  },
];

export default function BillsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-20">
      <header className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Bills</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {billOptions.map((option) => (
          <Card
            key={option.href}
            className="hover:bg-muted/40 transition-colors"
          >
            <Link href={option.href}>
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-3 flex h-11 w-11 items-center justify-center rounded-lg">
                  <option.icon className="size-5" />
                </div>
                <CardTitle>{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {option.description}
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
