"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOperator } from "@/hooks/admin/useAdminOperators";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateOperatorForm() {
  const router = useRouter();
  const createMutation = useCreateOperator();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isoCountry, setIsoCountry] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !name || !isoCountry) {
      return;
    }

    createMutation.mutate(
      { code, name, isoCountry },
      {
        onSuccess: () => {
          router.push("/admin/dashboard/operators");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/operators">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Operators
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Operator</CardTitle>
          <CardDescription>
            Add a new network operator to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Operator Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MTN"
                required
              />
              <p className="text-muted-foreground text-xs">
                Unique identifier code (e.g., MTN, AIRTEL, GLO)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Operator Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MTN Nigeria"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">ISO Country Code</Label>
              <Input
                id="country"
                value={isoCountry}
                onChange={(e) => setIsoCountry(e.target.value.toUpperCase())}
                placeholder="NG"
                maxLength={2}
                required
              />
              <p className="text-muted-foreground text-xs">
                Two-letter country code (e.g., NG, GH, KE)
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/dashboard/operators">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Create Operator
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
