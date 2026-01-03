"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminOperator,
  useUpdateOperator,
} from "@/hooks/admin/useAdminOperators";
import { format } from "date-fns";
import { ArrowLeft, Edit, Loader2, Radio } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface OperatorDetailViewProps {
  operatorId: string;
}

export function OperatorDetailView({ operatorId }: OperatorDetailViewProps) {
  const { data, isLoading, isError, refetch } = useAdminOperator(operatorId);
  const updateMutation = useUpdateOperator();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("");

  const operator = data?.data;

  const handleEdit = () => {
    if (operator) {
      setEditName(operator.name);
      setEditCountry(operator.isoCountry);
      setIsEditOpen(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        operatorId,
        data: { name: editName, isoCountry: editCountry },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError || !operator) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load operator details
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard/operators">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Operators
            </Link>
          </Button>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Operator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Operator</DialogTitle>
              <DialogDescription>
                Update operator details. Code cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">ISO Country Code</Label>
                <Input
                  id="country"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  placeholder="NG"
                  maxLength={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Operator Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            {operator.name}
          </CardTitle>
          <CardDescription>Operator Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Operator ID" value={operator.id} mono />
          <InfoRow label="Code" value={operator.code} mono />
          <InfoRow label="Name" value={operator.name} />
          <InfoRow label="Country" value={operator.isoCountry} />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge
              variant={operator.isActive !== false ? "default" : "secondary"}
            >
              {operator.isActive !== false ? "Active" : "Inactive"}
            </Badge>
          </div>
          {operator.createdAt && (
            <InfoRow
              label="Created"
              value={format(new Date(operator.createdAt), "PPpp")}
            />
          )}
          {operator.updatedAt && (
            <InfoRow
              label="Updated"
              value={format(new Date(operator.updatedAt), "PPpp")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
