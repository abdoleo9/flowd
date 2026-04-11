"use client";

import { useState } from "react";
import { X, Phone, MapPin, Package } from "lucide-react";
import type { Order, OrderStatus } from "@/types/database";
import { formatDA, formatDateTime } from "@/lib/utils";
import { getWilayaName } from "@/constants/wilayas";
import { OrderStatusBadge, OrderSourceBadge } from "./OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface OrderDrawerProps {
  order: Order | null;
  onClose: () => void;
  onUpdated: () => void;
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Nouveau" },
  { value: "confirmed", label: "Confirmé" },
  { value: "ready", label: "Prêt" },
  { value: "shipped", label: "Expédié" },
  { value: "delivered", label: "Livré" },
  { value: "returned", label: "Retourné" },
  { value: "cancelled", label: "Annulé" },
];

export function OrderDrawer({ order, onClose, onUpdated }: OrderDrawerProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sending, setSending] = useState(false);

  if (!order) return null;

  async function updateStatus(newStatus: OrderStatus) {
    setUpdatingStatus(true);
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order!.id, status: newStatus }),
    });
    setUpdatingStatus(false);
    if (res.ok) {
      toast.success("Statut mis à jour");
      onUpdated();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function sendToDelivery() {
    setSending(true);
    try {
      // Update order status to shipped
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order!.id, status: "shipped" }),
      });

      // Insert delivery parcel record
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("delivery_parcels").insert({
        workspace_id: order!.workspace_id,
        order_id: order!.id,
        tracking_number: `FL-${Date.now()}`,
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

      if (error) throw error;

      toast.success("Commande envoyée en livraison");
      onUpdated();
    } catch {
      toast.error("Erreur lors de l'envoi en livraison");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] bg-card border-l border-border flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-white">{order.reference}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateTime(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status & Source */}
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <OrderSourceBadge source={order.source} />
          </div>

          {/* Customer */}
          <div className="bg-background rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Client
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                {order.customer_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{order.customer_name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={13} />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={13} />
                <span>
                  {getWilayaName(order.wilaya_code)}
                  {order.commune && ` — ${order.commune}`}
                  {order.address && `, ${order.address}`}
                </span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="bg-background rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Produit
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-muted flex items-center justify-center">
                <Package size={15} className="text-orange" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{order.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  Quantité: {order.quantity}
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Prix unitaire</span>
              <span className="text-white">{formatDA(order.unit_price)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Total</span>
              <span className="text-white text-base">{formatDA(order.total_price)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-background rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Notes
              </h4>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Status change */}
          <div className="bg-background rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Changer le statut
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  disabled={opt.value === order.status || updatingStatus}
                  className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                    opt.value === order.status
                      ? "border-accent bg-accent-muted text-accent cursor-default"
                      : "border-border text-muted-foreground hover:border-accent hover:text-accent disabled:opacity-40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Fermer
          </Button>
          <Button className="flex-1" onClick={sendToDelivery} disabled={sending} loading={sending}>
            Envoyer en livraison
          </Button>
        </div>
      </div>
    </>
  );
}
