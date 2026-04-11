"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import type { DeliveryParcel } from "@/types/database";
import { getWilayaName } from "@/constants/wilayas";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface DeliveryPanelProps {
  parcels: DeliveryParcel[];
}

export function DeliveryPanel({ parcels }: DeliveryPanelProps) {
  const { t } = useLanguage();

  const statusConfig = {
    pending_pickup: { label: t.status.pending, variant: "warning" as const },
    picked_up: { label: t.delivery.tracking, variant: "blue" as const },
    in_transit: { label: t.delivery.inTransit, variant: "orange" as const },
    out_for_delivery: { label: t.delivery.delivered, variant: "purple" as const },
    delivered: { label: t.delivery.delivered, variant: "success" as const },
    failed_attempt: { label: "Échec", variant: "danger" as const },
    returned_to_sender: { label: t.delivery.returned, variant: "danger" as const },
    lost: { label: "Lost", variant: "muted" as const },
  };

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-semibold text-white">{t.delivery.title}</h2>
        <Link
          href="/dashboard/delivery"
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
        >
          {t.delivery.inTransit} <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {parcels.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {t.delivery.noParcel}
          </div>
        ) : (
          parcels.map((parcel) => {
            const config = statusConfig[parcel.status] ?? { label: parcel.status, variant: "muted" as const };
            return (
              <div key={parcel.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-orange-muted flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{parcel.recipient_name}</p>
                  <p className="text-xs text-muted">
                    {parcel.tracking_number} · {parcel.wilaya_code ? getWilayaName(parcel.wilaya_code) : "—"}
                  </p>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
