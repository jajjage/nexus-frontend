"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOperators } from "@/hooks/admin/useAdminOperators";
import { Operator } from "@/types/admin/operator.types";
import { Eye, Plus, Radio, RefreshCw } from "lucide-react";
import Link from "next/link";

export function OperatorListTable() {
  const { data, isLoading, isError, refetch } = useAdminOperators();

  const operators = data?.data?.operators || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load operators</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          All Operators
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/dashboard/operators/new">
              <Plus className="mr-2 h-4 w-4" />
              New Operator
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    No operators found
                  </TableCell>
                </TableRow>
              ) : (
                operators.map((operator: Operator) => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-mono font-medium">
                      {operator.code}
                    </TableCell>
                    <TableCell>{operator.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{operator.isoCountry}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          operator.isActive !== false ? "default" : "secondary"
                        }
                      >
                        {operator.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link
                          href={`/admin/dashboard/operators/${operator.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {operators.length > 0 && (
          <p className="text-muted-foreground mt-4 text-sm">
            {operators.length} operator{operators.length !== 1 ? "s" : ""} total
          </p>
        )}
      </CardContent>
    </Card>
  );
}
