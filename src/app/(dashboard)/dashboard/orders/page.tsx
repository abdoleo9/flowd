"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RefreshCw, CheckSquare, Truck } from "lucide-react";
import type { Order, OrderStatus, OrderSource } from "@/types/database";
import { formatDA, formatDate } from "@/lib/utils";
import { getWilayaName } from "@/constants/wilayas";
import { OrderStatusBadge, OrderSourceBadge } from "@/components/orders/OrderStatusBadge";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";
import { OrderDrawer } from "@/components/orders/OrderDrawer";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const STATUS_TABS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "Nouveau" },
  { value: "confirmed", label: "Confirmé" },
  { value: "shipped", label: "Expédié" },
  { value: "delivered", label: "Livré" },
  { value: "returned", label: "Retourné" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | OrderSource>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);

  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/orders?${params}`);
    const json = await res.json();
    setOrders(json.data ?? []);
    setTotal(json.count ?? 0);
    setLoading(false);
  }, [page, statusFilter, sourceFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchOrders, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map((o) => o.id)));
  }

  async function bulkConfirm() {
    if (!selected.size) return;
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) =>
        fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "confirmed" }),
        })
      )
    );
    toast.success(`${ids.length} commande(s) confirmée(s)`);
    setSelected(new Set());
    fetchOrders();
  }

  async function bulkSendDelivery() {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const supabase = getSupabaseBrowserClient();
    let successCount = 0;

    await Promise.all(
      ids.map(async (id) => {
        const order = orders.find((o) => o.id === id);
        if (!order) return;

        // Update order status to shipped
        const res = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "shipped" }),
        });
        if (!res.ok) return;

        // Insert delivery parcel
        const { error } = await supabase.from("delivery_parcels").insert({
          workspace_id: order.workspace_id,
          order_id: order.id,
          tracking_number: `FL-${Date.now()}-${id.slice(0, 6)}`,
          carrier: "yalidine",
          status: "pending_pickup",
          status_history: [
            {
              status: "pending_pickup",
              timestamp: new Date().toISOString(),
              note: "Créé depuis Flowd",
            },
          ],
        });
        if (!error) successCount++;
      })
    );

    toast.success(`${successCount} commande(s) envoyée(s) en livraison`);
    setSelected(new Set());
    fetchOrders();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Commandes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} commande{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => fetchOrders()}
            loading={loading}
          >
            Actualiser
          </Button>
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Nouvelle commande
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-accent text-white"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher nom, tél, produit…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-card border border-border rounded-lg pl-8 pr-3.5 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-accent"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value as "all" | OrderSource); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent"
        >
          <option value="all">Toutes sources</option>
          <option value="manual">Manuel</option>
          <option value="instagram">Instagram</option>
          <option value="messenger">Messenger</option>
          <option value="shopify">Shopify</option>
          <option value="woocommerce">WooCommerce</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-accent-muted border border-accent/20 rounded-xl px-4 py-2.5">
          <span className="text-sm text-accent font-medium">
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<CheckSquare size={13} />}
              onClick={bulkConfirm}
            >
              Confirmer tout
            </Button>
            <Button
              size="sm"
              icon={<Truck size={13} />}
              onClick={bulkSendDelivery}
            >
              Envoyer en livraison
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selected.size === orders.length && orders.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Client</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Produit</th>
                <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">Wilaya</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">Montant</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">Source</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Statut</th>
                <th className="hidden lg:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">Date</th>
                <th className="hidden sm:table-cell py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                    Chargement…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setDrawerOrder(order)}
                  >
                    <td
                      className="py-3 px-4"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(order.id); }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-white">{order.customer_name}</p>
                      <p className="text-xs text-muted">{order.customer_phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-white">{order.product_name}</p>
                      <p className="text-xs text-muted">×{order.quantity}</p>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                      {getWilayaName(order.wilaya_code)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-white whitespace-nowrap">
                      {formatDA(order.total_price)}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4">
                      <OrderSourceBadge source={order.source} />
                    </td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="hidden lg:table-cell py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-xs px-2 py-1 rounded bg-success-muted text-success hover:bg-success/20 transition-colors"
                          onClick={() =>
                            fetch("/api/orders", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: order.id, status: "confirmed" }),
                            }).then(() => { toast.success("Confirmé"); fetchOrders(); })
                          }
                        >
                          Confirmer
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded bg-orange-muted text-orange hover:bg-orange/20 transition-colors"
                          onClick={() => toast.info("Envoi en livraison…")}
                        >
                          Livraison
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} sur {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateOrderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchOrders}
      />

      <OrderDrawer
        order={drawerOrder}
        onClose={() => setDrawerOrder(null)}
        onUpdated={() => { fetchOrders(); setDrawerOrder(null); }}
      />
    </div>
  );
}
