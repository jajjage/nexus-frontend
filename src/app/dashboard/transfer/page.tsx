import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TransferPage() {
  return (
    <div className="flex min-h-screen flex-col p-4 pb-20">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-6" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Transfer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Money Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Transfer feature coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
