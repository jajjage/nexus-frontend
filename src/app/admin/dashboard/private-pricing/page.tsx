"use client";

import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type User = { id: string; fullName?: string; email: string; phoneNumber?: string };
type Product = { id: string; name: string; productCode?: string; priceTags?: { api?: number } };
type PrivatePrice = {
  id: string;
  userId?: string;
  operatorProductId: string;
  amount: number | string;
  reason: string;
  effective_from?: string;
  priceTags?: { api?: number | string };
  productName?: string;
  productCode?: string;
};

export default function PrivatePricingPage() {
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [privatePrices, setPrivatePrices] = useState<PrivatePrice[]>([]);
  const [loadingPrivatePrices, setLoadingPrivatePrices] = useState(false);
  const selectedProduct = useMemo(() => products.find((product) => product.id === productId), [products, productId]);
  const assignedProductIds = useMemo(() => new Set(privatePrices.map((price) => price.operatorProductId)), [privatePrices]);
  const availableProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      if (assignedProductIds.has(product.id) && product.id !== productId) return false;
      return !query || `${product.name} ${product.productCode || ""}`.toLowerCase().includes(query);
    });
  }, [assignedProductIds, productId, productSearch, products]);

  useEffect(() => {
    apiClient.get("/admin/products").then((response) => {
      const raw = response.data?.data?.products || response.data?.data || [];
      setProducts(Array.isArray(raw) ? raw : []);
    }).catch(() => toast.error("Unable to load products"));
  }, []);

  async function loadPrivatePrices(userId: string) {
    setLoadingPrivatePrices(true);
    try {
      const response = await apiClient.get("/admin/reseller-api/private-prices", { params: { userId, page: 1, limit: 100 } });
      const payload = response.data?.data;
      setPrivatePrices(Array.isArray(payload) ? payload : payload?.items || []);
    } catch {
      toast.error("Unable to load this user's private prices");
      setPrivatePrices([]);
    } finally { setLoadingPrivatePrices(false); }
  }

  useEffect(() => {
    const query = userSearch.trim();
    if (query.length < 2 || selectedUser) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const response = await apiClient.get("/admin/users", { params: { page: 1, limit: 20, search: query } });
        setUserResults(response.data?.data?.users || []);
      } catch {
        toast.error("Unable to search users");
        setUserResults([]);
      } finally { setSearchingUsers(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [selectedUser, userSearch]);

  function selectUser(user: User) {
    setSelectedUser(user);
    setUserSearch(user.email);
    setProductId("");
    setProductSearch("");
    setEditingPriceId(null);
    setAmount("");
    setReason("");
    void loadPrivatePrices(user.id);
  }

  function clearUser() {
    setSelectedUser(null);
    setUserSearch("");
    setPrivatePrices([]);
    setProductId("");
    setAmount("");
    setReason("");
    setEditingPriceId(null);
  }

  function editPrice(price: PrivatePrice) {
    setEditingPriceId(price.id);
    setProductId(price.operatorProductId);
    setAmount(String(price.amount));
    setReason(price.reason);
    setProductSearch(price.productName || price.productCode || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!selectedUser || !productId || !reason.trim() || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      toast.error("Choose a user and product, enter a valid amount, and provide a reason");
      return;
    }
    setSaving(true);
    try {
      const payload = { amount: Number(amount), reason: reason.trim() };
      if (editingPriceId) {
        await apiClient.patch(`/admin/reseller-api/private-prices/${editingPriceId}`, payload);
        toast.success("Private price updated");
      } else {
        await apiClient.post("/admin/reseller-api/private-prices", { userId: selectedUser.id, operatorProductId: productId, ...payload });
        toast.success("Private price added");
      }
      await loadPrivatePrices(selectedUser.id);
      setProductId(""); setProductSearch(""); setAmount(""); setReason(""); setEditingPriceId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to save private price");
    } finally { setSaving(false); }
  }

  async function removePrice(price: PrivatePrice) {
    if (!window.confirm(`Remove the private price for ${price.productName || price.productCode || "this product"}?`)) return;
    try {
      await apiClient.delete(`/admin/reseller-api/private-prices/${price.id}`);
      toast.success("Private price removed");
      if (selectedUser) await loadPrivatePrices(selectedUser.id);
      if (editingPriceId === price.id) { setEditingPriceId(null); setProductId(""); setAmount(""); setReason(""); }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to remove private price");
    }
  }

  return <div className="mx-auto max-w-6xl space-y-8">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pricing control</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Private prices</h1><p className="mt-2 max-w-2xl text-muted-foreground">Select one user to see every product with a private price, then add, edit, or remove that user's overrides.</p></div>

    <Card className="border-slate-200 shadow-sm dark:border-slate-800"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" />Choose a user</CardTitle></CardHeader><CardContent>
      <Label htmlFor="private-user-search">Search by name, email, or phone</Label>
      <div className="relative mt-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="private-user-search" className="pl-9" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); if (selectedUser) clearUser(); }} placeholder="Search thousands of users…" /></div>
      {!selectedUser && <p className="mt-2 text-xs text-muted-foreground">Type at least 2 characters. Results are searched on the server.</p>}
      {searchingUsers && <p className="mt-3 text-sm text-muted-foreground">Searching users…</p>}
      {!searchingUsers && !selectedUser && userSearch.trim().length >= 2 && userResults.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No matching users found.</p>}
      {!selectedUser && userResults.length > 0 && <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border bg-background p-1">{userResults.map((user) => <button type="button" key={user.id} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => selectUser(user)}><span><span className="font-medium">{user.fullName || user.email}</span><span className="ml-2 text-muted-foreground">{user.email}</span></span>{user.phoneNumber && <span className="text-xs text-muted-foreground">{user.phoneNumber}</span>}</button>)}</div>}
      {selectedUser && <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/30"><span>Pricing for <span className="font-semibold">{selectedUser.fullName || selectedUser.email}</span> · {selectedUser.email}</span><Button variant="ghost" size="sm" onClick={clearUser}>Change user</Button></div>}
    </CardContent></Card>

    {selectedUser && <>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800"><CardHeader><CardTitle>{editingPriceId ? "Edit private price" : "Add a private price"}</CardTitle><p className="text-sm text-muted-foreground">Private pricing overrides the user's normal, reseller, and API price across every channel.</p></CardHeader><CardContent className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2"><Label htmlFor="private-product-search">Search products</Label><Input id="private-product-search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search by product name or code" /></div>
        <div className="space-y-2 md:col-span-2"><Label>Product</Label><Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger><SelectContent>{availableProducts.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} · {product.productCode || product.id}</SelectItem>)}</SelectContent></Select>{availableProducts.length === 0 && <p className="text-xs text-muted-foreground">No unassigned products match your search.</p>}</div>
        <div className="rounded-xl bg-muted/40 p-4 text-sm"><p className="text-muted-foreground">Existing API price</p><p className="mt-1 text-xl font-semibold">₦{Number(selectedProduct?.priceTags?.api || 0).toLocaleString()}</p></div>
        <div className="space-y-2"><Label htmlFor="private-amount">Private amount</Label><Input id="private-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="private-reason">Reason</Label><Input id="private-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Preferred enterprise price" /></div>
        <div className="flex justify-end gap-2 md:col-span-2">{editingPriceId && <Button variant="outline" onClick={() => { setEditingPriceId(null); setProductId(""); setProductSearch(""); setAmount(""); setReason(""); }}>Cancel</Button>}<Button onClick={save} disabled={saving}>{saving ? "Saving…" : editingPriceId ? "Update private price" : "Add private price"}</Button></div>
      </CardContent></Card>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800"><CardHeader><CardTitle>Products with private pricing</CardTitle><p className="text-sm text-muted-foreground">Only active private prices for the selected user are shown.</p></CardHeader><CardContent>
        {loadingPrivatePrices ? <p className="text-sm text-muted-foreground">Loading this user's prices…</p> : privatePrices.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No private prices have been assigned to this user.</div> : <div className="space-y-3">{privatePrices.map((price) => { const apiPrice = Number(price.priceTags?.api || 0); const privateAmount = Number(price.amount || 0); const delta = privateAmount - apiPrice; return <div key={price.id} className="rounded-xl border bg-background p-4 transition-colors hover:bg-muted/30"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><p className="font-semibold">{price.productName || "Unknown product"}</p><p className="font-mono text-xs text-muted-foreground">{price.productCode || price.operatorProductId}</p><p className="mt-2 text-sm">Reason: {price.reason}</p></div><div className="flex items-start gap-4"><div className="text-right"><p className="text-xl font-semibold">₦{privateAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p><p className={delta <= 0 ? "text-xs text-emerald-600" : "text-xs text-amber-600"}>{delta === 0 ? "Same as API price" : `${delta < 0 ? "₦" : "+₦"}${Math.abs(delta).toLocaleString("en-NG", { minimumFractionDigits: 2 })} vs API price`}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Edit ${price.productName || price.productCode}`} onClick={() => editPrice(price)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Remove ${price.productName || price.productCode}`} onClick={() => void removePrice(price)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground"><span>API price: ₦{apiPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>{price.effective_from && <span>From: {new Date(price.effective_from).toLocaleDateString("en-NG")}</span>}</div></div>; })}</div>}
      </CardContent></Card>
    </>}
  </div>;
}
