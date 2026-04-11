import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WORKSPACE_COOKIE } from "@/lib/active-workspace";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await request.json();

  // Verify user is a member
  const { data: membership } = await supabase
    .from("team_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("workspace_id", workspaceId)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return response;
}
