"use client";

import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type User = { id: string; fullName?: string; email: string };
type Product = { id: string; name: string; productCode?: string; product_type?: string; priceTags?: { user?: number; reseller?: number; api?: number } };

export default function PrivatePricingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedProduct = useMemo(() => products.find((product) => product.id === productId), [products, productId]);

  useEffect(() => {
    Promise.all([apiClient.get("/admin/users"), apiClient.get("/admin/products")]).then(([usersResponse, productsResponse]) => {
      const rawUsers = usersResponse.data?.data?.users || usersResponse.data?.data || [];
      const rawProducts = productsResponse.data?.data?.products || productsResponse.data?.data || [];
      setUsers(Array.isArray(rawUsers) ? rawUsers : []);
      setProducts(Array.isArray(rawProducts) ? rawProducts : []);
    }).catch(() => toast.error("Unable to load users and products"));
  }, []);

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to save private price");
    } finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-5xl space-y-8">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pricing control</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Private prices</h1><p className="mt-2 max-w-2xl text-muted-foreground">Set an exact product price for one user. It will override the normal user, reseller, and API price across every purchase channel.</p></div>
    <Card className="border-slate-200 shadow-sm dark:border-slate-800"><CardHeader><CardTitle>Set a user price</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2"><Label>User</Label><Select value={userId} onValueChange={setUserId}><SelectTrigger><SelectValue placeholder="Search/select a user" /></SelectTrigger><SelectContent>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName || user.email} · {user.email}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2 md:col-span-2"><Label>Product</Label><Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger><SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} · {product.productCode || product.id}</SelectItem>)}</SelectContent></Select></div>
      <div className="rounded-xl bg-muted/40 p-4 text-sm"><p className="text-muted-foreground">Existing API price</p><p className="mt-1 text-xl font-semibold">₦{Number(selectedProduct?.priceTags?.api || 0).toLocaleString()}</p></div>
      <div className="space-y-2"><Label htmlFor="private-amount">Private amount</Label><Input id="private-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div>
      <div className="space-y-2 md:col-span-2"><Label htmlFor="private-reason">Reason</Label><Input id="private-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Preferred enterprise price" /></div>
      <div className="md:col-span-2 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Set private price"}</Button></div>
    </CardContent></Card>
  </div>;
}
