"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminResellerOperationsOverview } from "@/hooks/admin/useAdminResellerApi";
import { AdminResellerPurchaseAnalyticsQueryParams } from "@/types/admin/reseller-api.types";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, XCircle, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const ranges = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
] as const;

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export function UnifiedApiOperationsDashboard() {
  const [range, setRange] = useState<(typeof ranges)[number]["hours"]>(24);
  const [source, setSource] = useState<"all" | "legacy_reseller" | "v1_api">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [custom, setCustom] = useState(false);
  const params = useMemo<AdminResellerPurchaseAnalyticsQueryParams>(() => {
    if (custom) return { fromDate: fromDate || undefined, toDate: toDate || undefined, source };
    const from = new Date(Date.now() - range * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    return { fromDate: from, toDate: to, source };
  }, [custom, fromDate, range, source, toDate]);
  const { data, isLoading, isFetching, isError, refetch } = useAdminResellerOperationsOverview(params);
  const overview = data?.data;
  const statusCards = [
    { label: "Successful", value: overview?.status.success || 0, amount: overview?.amounts.success || 0, icon: CheckCircle2, className: "text-emerald-600" },
    { label: "Failed", value: overview?.status.failed || 0, amount: overview?.amounts.failed || 0, icon: XCircle, className: "text-red-600" },
    { label: "Pending", value: overview?.status.pending || 0, amount: overview?.amounts.pending || 0, icon: Clock3, className: "text-amber-600" },
    { label: "Reversed", value: overview?.status.reversed || 0, amount: overview?.amounts.reversed || 0, icon: RefreshCw, className: "text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operations window</p>
            <p className="mt-1 text-sm text-muted-foreground">All API traffic · UTC dates · source-aware metrics</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex rounded-md border p-1">
              {ranges.map((item) => <Button key={item.label} size="sm" variant={!custom && range === item.hours ? "default" : "ghost"} onClick={() => { setCustom(false); setRange(item.hours); }}>{item.label}</Button>)}
              <Button size="sm" variant={custom ? "default" : "ghost"} onClick={() => setCustom(true)}>Custom</Button>
            </div>
            <select value={source} onChange={(event) => setSource(event.target.value as typeof source)} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="all">All sources</option><option value="v1_api">V1 API</option><option value="legacy_reseller">Legacy reseller</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "mr-2 size-4 animate-spin" : "mr-2 size-4"} />Refresh</Button>
          </div>
          {custom ? <div className="flex gap-2 lg:col-span-2"><div><Label htmlFor="ops-from">From</Label><Input id="ops-from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></div><div><Label htmlFor="ops-to">To</Label><Input id="ops-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div></div> : null}
        </CardContent>
      </Card>

      {isLoading && !overview ? <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div> : null}
      {isError ? <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>Operations data unavailable</AlertTitle><AlertDescription>Check the admin analytics permission and API service, then refresh.</AlertDescription></Alert> : null}
      {overview ? <>
        {overview.alerts.length ? <div className="space-y-2">{overview.alerts.map((alert) => <Alert key={alert.code} variant={alert.severity === "critical" ? "destructive" : "default"}><AlertTriangle className="size-4" /><AlertTitle>{alert.severity === "critical" ? "Critical" : "Warning"}</AlertTitle><AlertDescription>{alert.message}</AlertDescription></Alert>)}</div> : <Alert><CheckCircle2 className="size-4 text-emerald-600" /><AlertTitle>All systems within thresholds</AlertTitle><AlertDescription>No active API operation alerts for this window.</AlertDescription></Alert>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total requests</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{overview.totals.requests.toLocaleString()}</p><p className="text-xs text-muted-foreground">{overview.totals.resolved.toLocaleString()} resolved</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Processed value</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{money(overview.totals.amount)}</p><p className="text-xs text-muted-foreground">all selected sources</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Success rate</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{overview.totals.successRate}</p><p className="text-xs text-muted-foreground">resolved requests only</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">P95 latency</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{overview.latency.p95Ms ? `${(overview.latency.p95Ms / 1000).toFixed(1)}s` : "—"}</p><p className="text-xs text-muted-foreground">end-to-end estimate</p></CardContent></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Zap className="size-4" />Status performance</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{statusCards.map((item) => <div key={item.label} className="rounded-lg border p-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{item.label}</span><item.icon className={`size-4 ${item.className}`} /></div><p className="mt-2 text-2xl font-bold">{item.value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{money(item.amount)}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Traffic sources & networks</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3">{Object.entries(overview.bySource).map(([key, value]) => <div key={key} className="rounded-lg bg-muted/50 p-3"><p className="text-xs uppercase text-muted-foreground">{key === "v1_api" ? "V1 API" : "Legacy reseller"}</p><p className="text-2xl font-bold">{value.toLocaleString()}</p></div>)}</div><div className="space-y-2">{Object.entries(overview.byNetwork).map(([network, value]) => <div key={network} className="flex items-center justify-between border-b py-2 text-sm last:border-0"><span>Network {network}</span><span className="font-medium">{value.requests} requests · {value.success} success · {money(value.amount)}</span></div>)}</div></CardContent></Card>
        </div>
      </> : null}
    </div>
  );
}
