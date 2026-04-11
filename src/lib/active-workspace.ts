import { cookies } from "next/headers";
import { getSupabaseServerClient } from "./supabase/server";

export const WORKSPACE_COOKIE = "flowd_workspace_id";

export async function getActiveWorkspaceId(): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = cookies();
  const fromCookie = cookieStore.get(WORKSPACE_COOKIE)?.value;

  const { data: memberships } = await supabase
    .from("team_members")
    .select("workspace_id")
    .eq("user_id", user.id);

  if (!memberships?.length) return null;

  // Validate cookie belongs to this user
  if (fromCookie && memberships.some((m) => m.workspace_id === fromCookie)) {
    return fromCookie;
  }

  return memberships[0].workspace_id;
}
