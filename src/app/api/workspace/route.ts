import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("team_members")
    .select("workspace_id, role, workspace:workspaces(id, name, slug)")
    .eq("user_id", user.id);

  const workspaces = (memberships ?? []).map((m) => {
    const ws = (Array.isArray(m.workspace) ? m.workspace[0] : m.workspace) as { id: string; name: string; slug: string } | null;
    return { id: ws?.id ?? "", name: ws?.name ?? "", slug: ws?.slug ?? "", role: m.role };
  }).filter((w) => w.id);

  return NextResponse.json({ workspaces });
}
