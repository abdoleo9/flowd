import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { WORKSPACE_COOKIE } from "@/lib/active-workspace";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone, wilayaCode } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const admin = getSupabaseServiceClient();

  const slug = name.trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);

  const { data: workspace, error } = await admin
    .from("workspaces")
    .insert({
      name: name.trim(),
      slug: `${slug}-${Math.random().toString(36).slice(2, 7)}`,
      phone: phone?.trim() ?? null,
      wilaya_code: wilayaCode ? parseInt(wilayaCode) : null,
      chatbot_config: {
        persona: "Assistant sympathique et professionnel",
        language_mode: "auto",
        greeting: "Marhba! Kifach naaawnek?",
        order_instructions: "Quand le client veut commander, demande: nom complet, numéro de téléphone, wilaya, adresse, produit(s).",
        languages: { darija: true, french: true, english: true, arabic: false },
      },
    })
    .select("id")
    .single();

  if (error || !workspace) return NextResponse.json({ error: "Failed to create" }, { status: 500 });

  await admin.from("team_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  const response = NextResponse.json({ workspaceId: workspace.id });
  response.cookies.set(WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
