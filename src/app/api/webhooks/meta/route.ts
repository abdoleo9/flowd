import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { genAI, detectLanguage, buildSystemPrompt } from "@/lib/claude";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN ?? "flowd_webhook_2024";

// Service-role client — bypasses RLS (needed for webhook, no user session)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: Meta webhook verification ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      const { data: integrations } = await supabaseAdmin
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
      const { data: workspace } = await supabaseAdmin
        .from("workspaces")
        .select("chatbot_config")
        .eq("id", workspaceId)
        .single();

      const chatbotConfig = workspace?.chatbot_config ?? {
        persona: "Assistant sympathique pour boutique e-commerce",
        language_mode: "auto",
        greeting: "Marhba !",
        order_instructions: "Demande le nom complet, numéro de téléphone, wilaya et adresse.",
        languages: { darija: true, french: true, english: true, arabic: false },
      };

      // ── Find or create conversation ────────────────────────────────────────
      // We store the sender's PSID in customer_phone (re-used as external ID)
      const { data: existingConv } = await supabaseAdmin
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
          await supabaseAdmin
            .from("conversations")
            .update({ status: "bot", updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        } else {
          await supabaseAdmin
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
      } else {
        const { data: newConv, error: convError } = await supabaseAdmin
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
      await supabaseAdmin.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: messageText,
      });

      // ── Load chat history ──────────────────────────────────────────────────
      const { data: history } = await supabaseAdmin
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(20);

      // ── Generate AI reply ──────────────────────────────────────────────────
      const language = detectLanguage(messageText);
      const systemPrompt = buildSystemPrompt(chatbotConfig, language);

      // Build history excluding the just-inserted user message
      const chatHistory = (history ?? [])
        .slice(0, -1)
        .filter((m: { role: string }) => m.role !== "system")
        .map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      let replyText = "";
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt,
        });
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(messageText);
        replyText = result.response.text();
      } catch (err) {
        console.error("[Meta Webhook] Gemini error:", err);
        replyText = "Désolé, je rencontre un problème technique. Un agent va vous répondre bientôt. 🙏";
      }

      // ── Save assistant reply ───────────────────────────────────────────────
      await supabaseAdmin.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: replyText,
      });

      // ── Send reply via Meta Graph API ──────────────────────────────────────
      try {
        const graphRes = await fetch(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(accessToken)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: { text: replyText },
              messaging_type: "RESPONSE",
            }),
          }
        );
        if (!graphRes.ok) {
          const errBody = await graphRes.json();
          console.error("[Meta Webhook] Graph API error:", errBody);
        }
      } catch (err) {
        console.error("[Meta Webhook] Failed to send reply:", err);
      }
    }
  }

  // Always return 200 to Meta (otherwise it retries)
  return NextResponse.json({ received: true });
}
