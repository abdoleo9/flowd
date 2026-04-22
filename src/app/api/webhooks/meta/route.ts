/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGroq, GROQ_MODEL, buildSystemPrompt } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = "flowd_webhook_2024";

// Service-role client — lazy init to avoid build-time failures when env vars are absent
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

// ─── GET: Meta webhook verification ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─── POST: Incoming messages ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Meta sends "instagram" or "page" (Messenger)
  if (body.object !== "instagram" && body.object !== "page") {
    return NextResponse.json({ received: true });
  }

  const entries = (body.entry as Record<string, unknown>[]) ?? [];

  for (const entry of entries) {
    const pageId = entry.id as string;
    const messagingEvents = (entry.messaging as Record<string, unknown>[]) ?? [];

    for (const event of messagingEvents) {
      const message = event.message as Record<string, unknown> | undefined;

      // Skip echoes (messages sent by the page itself) and non-text events
      if (!message || message.is_echo) continue;
      const messageText = message.text as string | undefined;
      if (!messageText?.trim()) continue;

      const sender = event.sender as { id: string };
      const senderId = sender.id;

      // ── Find workspace integration matching this page ──────────────────────
      // We look for instagram or messenger integration where credentials->page_id = entry.id
      const { data: integrations } = await getSupabaseAdmin()
        .from("integrations")
        .select("workspace_id, credentials, type")
        .eq("is_active", true)
        .in("type", ["instagram", "messenger"]);

      const integration = (integrations ?? []).find((intg) => {
        const creds = intg.credentials as Record<string, string>;
        return creds.page_id === pageId;
      });

      if (!integration) {
        console.warn(`[Meta Webhook] No active integration found for page_id=${pageId}`);
        continue;
      }

      const workspaceId = integration.workspace_id as string;
      const creds = integration.credentials as Record<string, string>;
      const accessToken = creds.access_token;

      // ── Load workspace chatbot config ──────────────────────────────────────
      const { data: workspace } = await getSupabaseAdmin()
        .from("workspaces")
        .select("chatbot_config, name")
        .eq("id", workspaceId)
        .single();

      const chatbotConfig = workspace?.chatbot_config ?? {
        product_category: "produits",
        delivery_days: "3 à 7",
        payment_methods: "الدفع عند الاستلام",
      };

      // ── Find or create conversation ────────────────────────────────────────
      // We store the sender's PSID in customer_phone (re-used as external ID)
      const { data: existingConv } = await getSupabaseAdmin()
        .from("conversations")
        .select("id, status")
        .eq("workspace_id", workspaceId)
        .eq("channel", integration.type)
        .eq("customer_phone", senderId)
        .neq("status", "resolved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId: string;

      if (existingConv) {
        conversationId = existingConv.id as string;
        // Reopen if it was closed
        if (existingConv.status !== "open" && existingConv.status !== "bot") {
          await getSupabaseAdmin()
            .from("conversations")
            .update({ status: "bot", updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        } else {
          await getSupabaseAdmin()
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
      } else {
        const { data: newConv, error: convError } = await getSupabaseAdmin()
          .from("conversations")
          .insert({
            workspace_id: workspaceId,
            channel: integration.type,
            customer_phone: senderId,
            customer_name: `Client ${senderId.slice(-4)}`,
            status: "bot",
          })
          .select("id")
          .single();

        if (convError || !newConv) {
          console.error("[Meta Webhook] Failed to create conversation:", convError);
          continue;
        }
        conversationId = newConv.id as string;
      }

      // ── Save incoming user message ─────────────────────────────────────────
      await getSupabaseAdmin().from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: messageText,
      });

      // ── Load chat history ──────────────────────────────────────────────────
      const { data: history } = await getSupabaseAdmin()
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(20);

      // ── Generate AI reply ──────────────────────────────────────────────────
      const systemPrompt = buildSystemPrompt(chatbotConfig, workspace?.name ?? "La Boutique");

      let replyText = "";
      try {
        // Build messages for Groq — directly use content from DB (fix: was using Gemini parts format)
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
          ...(history ?? [])
            .slice(0, -1) // exclude the just-inserted user message
            .filter((m: { role: string }) => m.role !== "system")
            .map((m: { role: string; content: string }) => ({
              role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
              content: m.content,
            })),
          { role: "user", content: messageText },
        ];

        const completion = await getGroq().chat.completions.create({
          model: GROQ_MODEL,
          messages,
          max_tokens: 500,
          temperature: 0.7,
        });
        replyText = completion.choices[0]?.message?.content ?? "Marhba! Comment puis-je vous aider? 😊";
      } catch (err) {
        console.error("[Meta Webhook] Groq error:", String(err));
        await getSupabaseAdmin().from("messages").insert({
          conversation_id: conversationId,
          role: "system",
          content: `GROQ_ERROR: ${String(err)}`,
        });
        replyText = "Marhba! Comment puis-je vous aider aujourd'hui? 😊";
      }

      // ── Save assistant reply ───────────────────────────────────────────────
      await getSupabaseAdmin().from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: replyText,
      });

      // ── Send reply via Meta Graph API ──────────────────────────────────────
      try {
        // For Instagram: use graph.instagram.com with the Instagram user token
        const igUserId = creds.page_id ?? pageId;
        const sendUrl = integration.type === "instagram"
          ? `https://graph.instagram.com/v21.0/${igUserId}/messages`
          : `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(accessToken)}`;

        const graphRes = await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(integration.type === "instagram"
              ? { "Authorization": `Bearer ${accessToken}` }
              : {}),
          },
          body: JSON.stringify({
            recipient: { id: senderId },
            message: { text: replyText },
            messaging_type: "RESPONSE",
          }),
        });
        const sendResult = await graphRes.json();
        if (!graphRes.ok) {
          console.error("[Meta Webhook] Graph API send error:", JSON.stringify(sendResult));
          // Save send error to DB for debugging
          await getSupabaseAdmin().from("messages").insert({
            conversation_id: conversationId,
            role: "system",
            content: `SEND_ERROR: ${JSON.stringify(sendResult)}`,
          });
        } else {
          console.log("[Meta Webhook] Message sent successfully:", JSON.stringify(sendResult));
        }
      } catch (err) {
        console.error("[Meta Webhook] Failed to send reply:", err);
      }
    }
  }

  // Always return 200 to Meta (otherwise it retries)
  return NextResponse.json({ received: true });
}
