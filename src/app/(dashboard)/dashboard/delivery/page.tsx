"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package } from "lucide-react";
import type { DeliveryParcel, ParcelStatus } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDA, formatDate, formatDateTime } from "@/lib/utils";
import { getWilayaName } from "@/constants/wilayas";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DeliveryPage() {
  const { t } = useLanguage();
  const [parcels, setParcels] = useState<DeliveryParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<DeliveryParcel | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | ParcelStatus>("all");
  const [filterCarrier, setFilterCarrier] = useState("all");
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

  const statusConfig: Record<
    ParcelStatus,
    { label: string; variant: "warning" | "blue" | "orange" | "purple" | "success" | "danger" | "muted" }
  > = {
    pending_pickup: { label: t.delivery.pendingPickup, variant: "warning" },
    picked_up: { label: t.delivery.pickedUp, variant: "blue" },
    in_transit: { label: t.delivery.inTransit, variant: "orange" },
    out_for_delivery: { label: t.delivery.outForDelivery, variant: "purple" },
    delivered: { label: t.delivery.delivered, variant: "success" },
    failed_attempt: { label: t.delivery.failedAttempt, variant: "danger" },
    returned_to_sender: { label: t.delivery.returnedToSender, variant: "danger" },
    lost: { label: t.delivery.lost, variant: "muted" },
  };

  const fetchParcels = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    let query = supabase
      .from("delivery_parcels")
      .select("*")
      .eq("workspace_id", activeWorkspace.id)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterCarrier !== "all") query = query.eq("carrier", filterCarrier);

    const { data } = await query;
    setParcels(data ?? []);
    setLoading(false);
  }, [supabase, activeWorkspace, filterStatus, filterCarrier]);

  useEffect(() => { fetchParcels(); }, [fetchParcels]);

  async function syncAll() {
    setSyncing(true);
    const res = await fetch("/api/delivery/sync", { method: "POST" });
    const json = await res.json();
    setSyncing(false);
    toast.success(json.message ?? "Synchronisation terminée");
    fetchParcels();
  }

  const total = parcels.length;
  const delivered = parcels.filter((p) => p.status === "delivered").length;
  const inTransit = parcels.filter((p) => ["in_transit", "out_for_delivery", "picked_up"].includes(p.status)).length;
  const returned = parcels.filter((p) => p.status === "returned_to_sender").length;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const carriers = Array.from(new Set(parcels.map((p) => p.carrier)));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t.delivery.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.delivery.subtitle}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} className={syncing ? "animate-spin" : ""} />}
          onClick={syncAll}
          loading={syncing}
        >
          {t.delivery.syncAll}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: t.delivery.totalSent, value: total, color: "text-white" },
          { label: t.delivery.delivered, value: delivered, color: "text-success" },
          { label: t.delivery.inTransit, value: inTransit, color: "text-orange" },
          { label: t.delivery.returned, value: returned, color: "text-danger" },
          { label: t.delivery.deliveryRateLabel, value: `${deliveryRate}%`, color: "text-accent" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | ParcelStatus)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent"
        >
          <option value="all">{t.delivery.allStatuses}</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={filterCarrier}
          onChange={(e) => setFilterCarrier(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent"
        >
          <option value="all">{t.delivery.allCarriers}</option>
          {carriers.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{t.delivery.tracking}</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.orders.customer}</th>
                <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.orders.wilaya}</th>
                <th className="hidden lg:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.orders.product}</th>
                <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.delivery.carrier}</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.delivery.cod}</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.orders.source}</th>
                <th className="hidden lg:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{t.orders.date}</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                    {t.actions.loading}
                  </td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                    <Package size={32} className="mx-auto mb-3 opacity-20" />
                    {t.delivery.noParcel}
                  </td>
                </tr>
              ) : (
                parcels.map((parcel) => {
                  const sc = statusConfig[parcel.status] ?? { label: parcel.status, variant: "muted" as const };
                  return (
                    <tr
                      key={parcel.id}
                      className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedParcel(parcel)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-white whitespace-nowrap">
                        {parcel.tracking_number}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-white">{parcel.recipient_name}</p>
                        <p className="text-xs text-muted">{parcel.recipient_phone}</p>
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-sm text-muted-foreground">
                        {parcel.wilaya_code ? getWilayaName(parcel.wilaya_code) : "—"}
                      </td>
                      <td className="hidden lg:table-cell py-3 px-4 text-sm text-muted-foreground">
                        {parcel.order_id ? parcel.order_id.slice(0, 8) + "…" : "—"}
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-sm text-white capitalize">{parcel.carrier}</td>
                      <td className="hidden sm:table-cell py-3 px-4 text-sm font-medium text-white">
                        {parcel.cod_amount ? formatDA(parcel.cod_amount) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </td>
                      <td className="hidden lg:table-cell py-3 px-4 text-xs text-muted-foreground">
                        {formatDate(parcel.shipped_at ?? parcel.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedParcel(parcel); }}
                          className="text-xs px-2 py-1 rounded bg-accent-muted text-accent hover:bg-accent/20 transition-colors"
                        >
                          {t.delivery.details}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parcel detail modal */}
      <Modal
        open={!!selectedParcel}
        onClose={() => setSelectedParcel(null)}
        title={`${t.delivery.parcel} ${selectedParcel?.tracking_number}`}
      >
        {selectedParcel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">{t.delivery.recipient}</p>
                <p className="text-white font-medium">{selectedParcel.recipient_name}</p>
                <p className="text-muted-foreground">{selectedParcel.recipient_phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">{t.orders.wilaya}</p>
                <p className="text-white">
                  {selectedParcel.wilaya_code ? getWilayaName(selectedParcel.wilaya_code) : "—"}
                </p>
                {selectedParcel.commune && <p className="text-muted-foreground">{selectedParcel.commune}</p>}
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">{t.delivery.carrier}</p>
                <p className="text-white capitalize">{selectedParcel.carrier}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">{t.delivery.cod}</p>
                <p className="text-white font-medium">
                  {selectedParcel.cod_amount ? formatDA(selectedParcel.cod_amount) : "—"}
                </p>
              </div>
            </div>

            {/* Timeline */}
            {selectedParcel.status_history && selectedParcel.status_history.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t.delivery.timeline}
                </p>
                <div className="relative pl-4 space-y-4">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
                  {selectedParcel.status_history.map((event, i) => (
                    <div key={i} className="relative flex gap-3">
                      <div className="absolute -left-3 w-2.5 h-2.5 rounded-full bg-accent border-2 border-background" />
                      <div>
                        <p className="text-sm text-white font-medium">{event.status}</p>
                        {event.note && <p className="text-xs text-muted-foreground">{event.note}</p>}
                        <p className="text-xs text-muted">{formatDateTime(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
