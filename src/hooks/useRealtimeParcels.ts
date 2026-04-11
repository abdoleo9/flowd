"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DeliveryParcel } from "@/types/database";

export function useRealtimeParcels(workspaceId: string | null, initial: DeliveryParcel[] = []) {
  const [parcels, setParcels] = useState<DeliveryParcel[]>(initial);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`parcels:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_parcels",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setParcels((prev) => [payload.new as DeliveryParcel, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setParcels((prev) =>
              prev.map((p) =>
                p.id === (payload.new as DeliveryParcel).id ? (payload.new as DeliveryParcel) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setParcels((prev) => prev.filter((p) => p.id !== (payload.old as DeliveryParcel).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, supabase]);

  return { parcels, setParcels };
}
