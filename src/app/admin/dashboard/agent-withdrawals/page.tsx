"use client";

import { AdminBankWithdrawalsTable } from "@/components/features/withdrawal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useState } from "react";

export default function AdminAgentWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [agentSearch, setAgentSearch] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Withdrawals</h1>
        <p className="mt-2 text-gray-600">
          Manage agent bank withdrawal requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>
            Review and process agent bank withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <select
                id="status-filter"
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value || undefined)}
                className="border-input bg-background text-foreground ring-offset-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-search">Search by Agent ID</Label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="agent-search"
                  type="text"
                  placeholder="Enter agent ID..."
                  className="pl-10"
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <AdminBankWithdrawalsTable
            statusFilter={statusFilter}
            agentUserId={agentSearch || undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
