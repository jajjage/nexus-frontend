"use client";

import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type User = { id: string; fullName?: string; email: string; phoneNumber?: string };
type Product = { id: string; name: string; productCode?: string; product_type?: string; priceTags?: { user?: number; reseller?: number; api?: number } };
type PrivatePrice = {
  id: string;
  amount: number | string;
  reason: string;
  is_active?: boolean;
  created_at?: string;
  effective_from?: string;
  expires_at?: string | null;
  userFullName?: string;
  userEmail?: string;
  userPhoneNumber?: string;
  productName?: string;
  productCode?: string;
  priceTags?: { api?: number | string };
};

export default function PrivatePricingPage() {
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [privatePrices, setPrivatePrices] = useState<PrivatePrice[]>([]);
  const [loadingPrivatePrices, setLoadingPrivatePrices] = useState(true);
  const selectedProduct = useMemo(() => products.find((product) => product.id === productId), [products, productId]);

  useEffect(() => {
    apiClient.get("/admin/products").then((productsResponse) => {
      const rawProducts = productsResponse.data?.data?.products || productsResponse.data?.data || [];
      setProducts(Array.isArray(rawProducts) ? rawProducts : []);
    }).catch(() => toast.error("Unable to load products"));
  }, []);

  async function loadPrivatePrices() {
    setLoadingPrivatePrices(true);
    try {
      const response = await apiClient.get("/admin/reseller-api/private-prices", { params: { page: 1, limit: 100 } });
      const payload = response.data?.data;
      setPrivatePrices(Array.isArray(payload) ? payload : payload?.items || []);
    } catch {
      toast.error("Unable to load private prices");
    } finally {
      setLoadingPrivatePrices(false);
    }
  }

  useEffect(() => {
    void loadPrivatePrices();
  }, []);

  useEffect(() => {
    const query = userSearch.trim();
    if (query.length < 2) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const response = await apiClient.get("/admin/users", { params: { page: 1, limit: 20, search: query } });
        const rawUsers = response.data?.data?.users || [];
        setUserResults(Array.isArray(rawUsers) ? rawUsers : []);
      } catch {
        toast.error("Unable to search users");
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [userSearch]);

  async function save() {
    if (!userId || !productId || !reason.trim() || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      toast.error("Choose a user and product, enter a valid amount, and provide a reason");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/admin/reseller-api/private-prices", { userId, operatorProductId: productId, amount: Number(amount), reason });
      toast.success("Private price saved");
      setAmount(""); setReason("");
      await loadPrivatePrices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to save private price");
    } finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-5xl space-y-8">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pricing control</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Private prices</h1><p className="mt-2 max-w-2xl text-muted-foreground">Set an exact product price for one user. It will override the normal user, reseller, and API price across every purchase channel.</p></div>
    <Card className="border-slate-200 shadow-sm dark:border-slate-800"><CardHeader><CardTitle>Set a user price</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3 md:col-span-2">
        <Label htmlFor="private-user-search">User</Label>
        <Input id="private-user-search" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search by name, email, or phone" />
        <p className="text-xs text-muted-foreground">Type at least 2 characters. Results are searched on the server.</p>
        {searchingUsers && <p className="text-sm text-muted-foreground">Searching users…</p>}
        {!searchingUsers && userSearch.trim().length >= 2 && userResults.length === 0 && <p className="text-sm text-muted-foreground">No matching users found.</p>}
        {userResults.length > 0 && <div className="max-h-56 overflow-y-auto rounded-xl border bg-background p-1">
          {userResults.map((user) => <button type="button" key={user.id} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setUserId(user.id); setSelectedUser(user); }}>
            <span><span className="font-medium">{user.fullName || user.email}</span><span className="ml-2 text-muted-foreground">{user.email}</span></span>
            {user.phoneNumber && <span className="text-xs text-muted-foreground">{user.phoneNumber}</span>}
          </button>)}
        </div>}
        {selectedUser && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">Selected: <span className="font-medium">{selectedUser.fullName || selectedUser.email}</span> · {selectedUser.email}</div>}
      </div>
      <div className="space-y-2 md:col-span-2"><Label>Product</Label><Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger><SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} · {product.productCode || product.id}</SelectItem>)}</SelectContent></Select></div>
      <div className="rounded-xl bg-muted/40 p-4 text-sm"><p className="text-muted-foreground">Existing API price</p><p className="mt-1 text-xl font-semibold">₦{Number(selectedProduct?.priceTags?.api || 0).toLocaleString()}</p></div>
      <div className="space-y-2"><Label htmlFor="private-amount">Private amount</Label><Input id="private-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div>
      <div className="space-y-2 md:col-span-2"><Label htmlFor="private-reason">Reason</Label><Input id="private-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Preferred enterprise price" /></div>
      <div className="md:col-span-2 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Set private price"}</Button></div>
    </CardContent></Card>
    <Card className="border-slate-200 shadow-sm dark:border-slate-800"><CardHeader><CardTitle>Active private prices</CardTitle><p className="text-sm text-muted-foreground">User-specific overrides currently applied before normal role and API pricing.</p></CardHeader><CardContent>
      {loadingPrivatePrices ? <p className="text-sm text-muted-foreground">Loading assigned prices…</p> : privatePrices.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No private prices have been assigned yet.</div> : <div className="space-y-3">
        {privatePrices.map((price) => {
          const apiPrice = Number(price.priceTags?.api || 0);
          const privateAmount = Number(price.amount || 0);
          const delta = privateAmount - apiPrice;
          return <div key={price.id} className="rounded-xl border bg-background p-4 transition-colors hover:bg-muted/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0"><p className="font-semibold">{price.productName || "Unknown product"}</p><p className="font-mono text-xs text-muted-foreground">{price.productCode || price.id}</p><p className="mt-2 text-sm">{price.userFullName || "Unnamed user"} <span className="text-muted-foreground">· {price.userEmail || price.userPhoneNumber || "No contact"}</span></p></div>
              <div className="text-left md:text-right"><p className="text-xl font-semibold">₦{privateAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p><p className={delta <= 0 ? "text-xs text-emerald-600" : "text-xs text-amber-600"}>{delta === 0 ? "Same as API price" : `${delta < 0 ? "₦" : "+₦"}${Math.abs(delta).toLocaleString("en-NG", { minimumFractionDigits: 2 })} vs API price`}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground"><span>API price: ₦{apiPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span><span>Reason: {price.reason}</span>{price.effective_from && <span>From: {new Date(price.effective_from).toLocaleDateString("en-NG")}</span>}</div>
          </div>;
        })}
      </div>}
    </CardContent></Card>
  </div>;
}
