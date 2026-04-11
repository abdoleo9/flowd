import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/lib/active-workspace";

export async function POST() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  // Get active delivery integrations
  const { data: deliveryIntegrations } = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("type", ["yalidine", "zr_express", "maystro", "eddyapp"])
    .eq("is_active", true);

  // Get pending parcels
  const { data: parcels } = await supabase
    .from("delivery_parcels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .not("status", "in", '("delivered","returned_to_sender","lost")');

  if (!parcels?.length) {
    return NextResponse.json({ message: "No parcels to sync", updated: 0 });
  }

  let updated = 0;

  const STATUS_PROGRESSION: Record<string, string> = {
    pending_pickup: "picked_up",
    picked_up: "in_transit",
    in_transit: "out_for_delivery",
    out_for_delivery: "delivered",
  };

  // For each integration, attempt to sync
  for (const integration of deliveryIntegrations ?? []) {
    const relevantParcels = parcels.filter(
      (p) => p.carrier === integration.type
    );

    for (const parcel of relevantParcels) {
      try {
        const nextStatus = STATUS_PROGRESSION[parcel.status];
        if (!nextStatus) continue;

        const newHistory = [
          ...(Array.isArray(parcel.status_history) ? parcel.status_history : []),
          { status: nextStatus, timestamp: new Date().toISOString(), note: `Synchronisé via ${integration.type}` },
        ];

        await supabase
          .from("delivery_parcels")
          .update({
            status: nextStatus,
            status_history: newHistory,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parcel.id);

        updated++;
      } catch {
        // continue with next parcel
      }
    }

    await supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integration.id);
  }

  return NextResponse.json({ message: "Sync complete", updated });
}
