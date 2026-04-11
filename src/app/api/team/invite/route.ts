import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/lib/active-workspace";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check role
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("workspace_id", workspaceId)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, role } = await request.json();
  if (!email || !role) {
    return NextResponse.json({ error: "Email and role required" }, { status: 400 });
  }

  const serviceClient = getSupabaseServiceClient();

  // Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { workspace_id: workspaceId, role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: inviteData.user?.id });
}
