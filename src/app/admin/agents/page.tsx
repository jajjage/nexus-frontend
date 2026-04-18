"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAgents, useDisableAgent, useEnableAgent } from "@/hooks/useAgent";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminAgentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAgents(page, 20);
  const { mutate: disableAgent, isPending: disabling } = useDisableAgent();
  const { mutate: enableAgent, isPending: enabling } = useEnableAgent();

  const formatCurrency = (value: number | string | null | undefined) =>
    `₦${Number(value ?? 0).toLocaleString()}`;

  const formatCount = (value: number | string | null | undefined) =>
    Number(value ?? 0).toLocaleString();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const agents = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination;
  const totalAgents = pagination?.total ?? agents.length;

  const handleToggleStatus = (agentId: string, isActive: boolean) => {
    if (isActive) {
      disableAgent(agentId, {
        onSuccess: () => {
          toast.success("Agent disabled");
        },
        onError: () => {
          toast.error("Failed to disable agent");
        },
      });
    } else {
      enableAgent(agentId, {
        onSuccess: () => {
          toast.success("Agent enabled");
        },
        onError: () => {
          toast.error("Failed to enable agent");
        },
      });
    }
  };

  return (
    <div className="bg-muted/40 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-gray-600">
            Manage and monitor all agents in the system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Agents</CardTitle>
            <CardDescription>Total agents: {totalAgents}</CardDescription>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No agents found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Customers</TableHead>
                        <TableHead>Total Earned</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Withdrawn</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell className="font-mono font-bold">
                            {agent.agentCode}
                          </TableCell>
                          <TableCell className="font-medium">
                            {agent.fullName}
                          </TableCell>
                          <TableCell>{agent.email}</TableCell>
                          <TableCell>
                            {formatCount(agent.totalCustomers)}
                            <span className="ml-1 text-xs text-gray-500">
                              ({formatCount(agent.activeCustomers)} active)
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(agent.totalCommissionsEarned)}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(agent.availableBalanceAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(agent.withdrawnCommissionsAmount)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                agent.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {agent.isActive ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link
                                href={`/admin/dashboard/agents/${agent.userId}`}
                              >
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant={
                                  agent.isActive ? "destructive" : "default"
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    agent.userId,
                                    agent.isActive
                                  )
                                }
                                disabled={disabling || enabling}
                              >
                                {agent.isActive ? "Disable" : "Enable"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-6">
                    <div className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasMore}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
