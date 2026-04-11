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

const statusConfig: Record<
  ParcelStatus,
  { label: string; variant: "warning" | "blue" | "orange" | "purple" | "success" | "danger" | "muted" }
> = {
  pending_pickup: { label: "Attente collecte", variant: "warning" },
  picked_up: { label: "Récupéré", variant: "blue" },
  in_transit: { label: "En transit", variant: "orange" },
  out_for_delivery: { label: "En livraison", variant: "purple" },
  delivered: { label: "Livré", variant: "success" },
  failed_attempt: { label: "Échec", variant: "danger" },
  returned_to_sender: { label: "Retourné", variant: "danger" },
  lost: { label: "Perdu", variant: "muted" },
};

export default function DeliveryPage() {
  const [parcels, setParcels] = useState<DeliveryParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<DeliveryParcel | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | ParcelStatus>("all");
  const [filterCarrier, setFilterCarrier] = useState("all");
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

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

  // Compute stats
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
          <h1 className="text-xl font-bold text-white">Livraison</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivi de tous vos colis
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} className={syncing ? "animate-spin" : ""} />}
          onClick={syncAll}
          loading={syncing}
        >
          Synchroniser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total envoyés", value: total, color: "text-white" },
          { label: "Livrés", value: delivered, color: "text-success" },
          { label: "En transit", value: inTransit, color: "text-orange" },
          { label: "Retournés", value: returned, color: "text-danger" },
          { label: "Taux livraison", value: `${deliveryRate}%`, color: "text-accent" },
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
          <option value="all">Tous statuts</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={filterCarrier}
          onChange={(e) => setFilterCarrier(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent"
        >
          <option value="all">Tous transporteurs</option>
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
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">N° suivi</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Client</th>
                <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">Wilaya</th>
                <th className="hidden lg:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">Produit</th>
                <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">Transporteur</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">COD</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Statut</th>
                <th className="hidden lg:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">Date</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                    Chargement…
                  </td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                    <Package size={32} className="mx-auto mb-3 opacity-20" />
                    Aucun colis
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
                          Détails
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

      {/* Parcel detail modal with tracking timeline */}
      <Modal
        open={!!selectedParcel}
        onClose={() => setSelectedParcel(null)}
        title={`Colis ${selectedParcel?.tracking_number}`}
      >
        {selectedParcel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Destinataire</p>
                <p className="text-white font-medium">{selectedParcel.recipient_name}</p>
                <p className="text-muted-foreground">{selectedParcel.recipient_phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Wilaya</p>
                <p className="text-white">
                  {selectedParcel.wilaya_code ? getWilayaName(selectedParcel.wilaya_code) : "—"}
                </p>
                {selectedParcel.commune && <p className="text-muted-foreground">{selectedParcel.commune}</p>}
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Transporteur</p>
                <p className="text-white capitalize">{selectedParcel.carrier}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">COD</p>
                <p className="text-white font-medium">
                  {selectedParcel.cod_amount ? formatDA(selectedParcel.cod_amount) : "—"}
                </p>
              </div>
            </div>

            {/* Timeline */}
            {selectedParcel.status_history && selectedParcel.status_history.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Historique
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
