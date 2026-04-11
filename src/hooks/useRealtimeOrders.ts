"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Order } from "@/types/database";

export function useRealtimeOrders(workspaceId: string | null, initial: Order[] = []) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`orders:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as Order).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, supabase]);

  return { orders, setOrders };
}
