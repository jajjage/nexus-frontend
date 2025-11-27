"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

export interface TransactionFiltersState {
  query: string;
  direction: "all" | "debit" | "credit";
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  setFilters: Dispatch<SetStateAction<TransactionFiltersState>>;
}

export function TransactionFilters({
  filters,
  setFilters,
}: TransactionFiltersProps) {
  return (
    <div className="bg-card grid grid-cols-1 gap-4 rounded-lg p-4 shadow-sm sm:grid-cols-3">
      {/* Search Input */}
      <div className="relative sm:col-span-2">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" />
        <Input
          placeholder="Search by amount, recipient, etc..."
          className="pl-10"
          value={filters.query}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, query: e.target.value }))
          }
        />
      </div>

      {/* Type Filter */}
      <Select
        value={filters.direction}
        onValueChange={(value: "all" | "debit" | "credit") =>
          setFilters((prev) => ({ ...prev, direction: value }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="debit">Debit</SelectItem>
          <SelectItem value="credit">Credit</SelectItem>
        </SelectContent>
      </Select>

      {/* Placeholder for Date Filter */}
      {/* <Button variant="outline">Date Range</Button> */}
    </div>
  );
}
