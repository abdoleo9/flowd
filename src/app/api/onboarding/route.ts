import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if workspace already exists for this user
  const { data: existing } = await supabase
    .from("team_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ workspaceId: existing.workspace_id });
  }

  const body = await request.json();
  const { fullName, businessName, phone, wilayaCode } = body;

  if (!fullName?.trim() || !businessName?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use service client to bypass RLS for initial setup
  const admin = getSupabaseServiceClient();

  // Upsert user profile
  await admin.from("users").upsert({
    id: user.id,
    email: user.email ?? "",
    full_name: fullName.trim(),
  });

  // Create workspace
  const slug = businessName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);

  const { data: workspace, error: wsError } = await admin
    .from("workspaces")
    .insert({
      name: businessName.trim(),
      slug: `${slug}-${Math.random().toString(36).slice(2, 7)}`,
      phone: phone?.trim() ?? null,
      wilaya_code: wilayaCode ? parseInt(wilayaCode) : null,
      chatbot_config: {
        persona: "Assistant sympathique et professionnel",
        language_mode: "auto",
        greeting: "Marhba! Kifach naaawnek?",
        order_instructions:
          "Quand le client veut commander, demande: nom complet, numéro de téléphone, wilaya, adresse, produit(s). Confirme ensuite le récapitulatif.",
        languages: { darija: true, french: true, english: true, arabic: false },
      },
    })
    .select("id")
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }

  // Add user as owner
  await admin.from("team_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ workspaceId: workspace.id });
}
