import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getActiveWorkspaceId } from "@/lib/active-workspace";

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/onboarding");

  const [
    { data: orders },
    { data: recentOrders },
    { data: parcels },
    { data: conversations },
  ] = await Promise.all([
    supabase.from("orders").select("status, total_price").eq("workspace_id", workspaceId),
    supabase.from("orders").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(5),
    supabase.from("delivery_parcels").select("*").eq("workspace_id", workspaceId).not("status", "in", '("delivered","returned_to_sender","lost")').order("created_at", { ascending: false }).limit(5),
    supabase.from("conversations").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(3),
  ]);

  const totalOrders = orders?.length ?? 0;
  const totalRevenue = orders?.filter((o) => o.status === "delivered").reduce((sum, o) => sum + (o.total_price ?? 0), 0) ?? 0;
  const shipped = orders?.filter((o) => ["shipped", "delivered"].includes(o.status)).length ?? 0;
  const delivered = orders?.filter((o) => o.status === "delivered").length ?? 0;
  const returned = orders?.filter((o) => o.status === "returned").length ?? 0;
  const deliveryRate = shipped > 0 ? Math.round((delivered / shipped) * 100) : 0;
  const returnRate = shipped > 0 ? Math.round((returned / shipped) * 100) : 0;

  return (
    <DashboardShell
      totalOrders={totalOrders}
      totalRevenue={totalRevenue}
      deliveryRate={deliveryRate}
      returnRate={returnRate}
      recentOrders={recentOrders ?? []}
      parcels={parcels ?? []}
      conversations={conversations ?? []}
    />
  );
}
