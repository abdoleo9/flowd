import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This route is called by Vercel Cron every week.
// Configure in vercel.json:
//   { "crons": [{ "path": "/api/cron/refresh-meta-tokens", "schedule": "0 9 * * 1" }] }
// Secured by CRON_SECRET — set this env var and Vercel will send it automatically.

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or an authorized source)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;

  if (!appId || !appSecret) {
    return NextResponse.json({ error: "META_APP_ID or META_APP_SECRET not set" }, { status: 500 });
  }

  // Load all active Meta integrations
  const { data: integrations, error } = await getSupabaseAdmin()
    .from("integrations")
    .select("id, workspace_id, type, credentials, token_expires_at")
    .eq("is_active", true)
    .in("type", ["instagram", "messenger", "whatsapp"]);

  if (error) {
    console.error("[Token Refresh] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; status: string; error?: string }[] = [];

  for (const integration of integrations ?? []) {
    const creds = integration.credentials as Record<string, string>;
    const token = creds.user_token ?? creds.access_token;

    if (!token) {
      results.push({ id: integration.id, status: "skipped_no_token" });
      continue;
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${appId}` +
        `&client_secret=${appSecret}` +
        `&fb_exchange_token=${encodeURIComponent(token)}`
      );
      const data = await res.json();

      if (!data.access_token) {
        results.push({ id: integration.id, status: "failed", error: data.error?.message ?? "no token returned" });
        continue;
      }

      const newExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const updatedCreds = { ...creds, user_token: data.access_token };

      await getSupabaseAdmin()
        .from("integrations")
        .update({
          credentials: updatedCreds,
          token_expires_at: newExpiry,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", integration.id);

      results.push({ id: integration.id, status: "refreshed" });
    } catch (err) {
      results.push({ id: integration.id, status: "error", error: String(err) });
    }
  }

  console.log("[Token Refresh] Results:", JSON.stringify(results));
  return NextResponse.json({ refreshed: results.filter((r) => r.status === "refreshed").length, results });
}
