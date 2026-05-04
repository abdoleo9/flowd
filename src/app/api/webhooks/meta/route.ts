/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { waitUntil } from "@vercel/functions";
import { getGenAI, GEMINI_MODEL, buildSystemPrompt } from "@/lib/claude";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verify token must match what is configured in the Meta Developer Console webhook settings
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "flowd_webhook_2024";

// ─── Supabase admin client (service role, lazy) ───────────────────────────────
// Typed as `any` so chained query results aren't inferred as `never` by tsc
let _supabaseAdmin: any = null;
function getSupabaseAdmin(): any {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

// ─── Opt-out keywords ─────────────────────────────────────────────────────────
const STOP_KEYWORDS = [
  "stop", "arrête", "arrete", "unsubscribe", "désabonner",
  "waqf", "وقف", "بطل", "ما تكتبلي", "حبس", "كفي",
];
const START_KEYWORDS = ["start", "reprendre", "ابدأ", "ابدا"];

// ─── Signature verification ───────────────────────────────────────────────────
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !process.env.META_APP_SECRET) return false;
  const expected = "sha256=" + crypto
    .createHmac("sha256", process.env.META_APP_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── GET: Meta webhook verification handshake ─────────────────────────────────
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

// ─── POST: Incoming messages ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await req.text();

  // Reject requests that fail signature verification
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifySignature(rawBody, signature)) {
    console.warn("[Meta Webhook] Invalid signature — request rejected");
    return new Response("Forbidden", { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Return 200 to Meta immediately — process asynchronously to stay under 20s limit
  waitUntil(processWebhookBody(body));
  return NextResponse.json({ received: true });
}

// ─── Async message processor ──────────────────────────────────────────────────
async function processWebhookBody(body: Record<string, unknown>) {
  if (body.object !== "instagram" && body.object !== "page") return;

  const entries = (body.entry as Record<string, unknown>[]) ?? [];

  for (const entry of entries) {
    const pageId = entry.id as string;
    const messagingEvents = (entry.messaging as Record<string, unknown>[]) ?? [];

    for (const event of messagingEvents) {
      try {
        await processEvent(pageId, event);
      } catch (err) {
        console.error("[Meta Webhook] processEvent error:", err);
      }
    }
  }
}

async function processEvent(pageId: string, event: Record<string, unknown>) {
  const message = event.message as Record<string, unknown> | undefined;

  // Skip echoes (messages sent by the page itself) and non-text events
  if (!message || message.is_echo) return;
  const messageText = (message.text as string | undefined)?.trim();
  if (!messageText) return;

  const sender = event.sender as { id: string };
  const senderId = sender.id;
  const messageTimestamp = (event.timestamp as number) ?? Date.now();

  // ── Find integration by page_id directly in JSONB (fast, indexed) ───────────
  const { data: rawIntegrations } = await getSupabaseAdmin()
    .from("integrations")
    .select("workspace_id, credentials, type")
    .eq("is_active", true)
    .in("type", ["instagram", "messenger"])
    .filter("credentials->>page_id", "eq", pageId);

  const integrations = rawIntegrations as { workspace_id: string; credentials: Record<string, string>; type: string }[] | null;
  const integration = integrations?.[0];
  if (!integration) {
    console.warn(`[Meta Webhook] No active integration for page_id=${pageId}`);
    return;
  }

  const workspaceId = integration.workspace_id as string;
  const creds = integration.credentials as Record<string, string>;
  const accessToken = creds.access_token;

  // ── Load workspace chatbot config ────────────────────────────────────────────
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

  // ── Find or create conversation ──────────────────────────────────────────────
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
    // Never auto-reset human_takeover — a human agent is handling this conversation.
    // Only update the timestamp to surface it as recently active.
    await getSupabaseAdmin()
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
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
      return;
    }
    conversationId = newConv.id as string;
  }

  // ── Save incoming user message ───────────────────────────────────────────────
  await getSupabaseAdmin().from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: messageText,
  });

  // ── Opt-out handling ─────────────────────────────────────────────────────────
  const lowerText = messageText.toLowerCase();

  if (STOP_KEYWORDS.some((k) => lowerText.includes(k))) {
    await getSupabaseAdmin()
      .from("conversations")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    const optOutReply = "✅ Vous avez été désinscrit des réponses automatiques. Envoyez 'START' pour vous réinscrire.";
    await saveAndSend({ conversationId, senderId, accessToken, integration, replyText: optOutReply });
    return;
  }

  if (START_KEYWORDS.some((k) => lowerText.includes(k))) {
    await getSupabaseAdmin()
      .from("conversations")
      .update({ status: "bot", updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  // ── Check if conversation is opted out (status resolved from a STOP) ─────────
  const { data: currentConv } = await getSupabaseAdmin()
    .from("conversations")
    .select("status")
    .eq("id", conversationId)
    .single();

  if (currentConv?.status === "resolved") return;

  // ── Check 24-hour messaging window (Instagram & Messenger policy) ────────────
  const messageAgeMs = Date.now() - messageTimestamp;
  const windowExpired = messageAgeMs > 24 * 60 * 60 * 1000;
  if (windowExpired) {
    console.warn(`[Meta Webhook] 24h window expired for conversation ${conversationId} — skipping reply`);
    await getSupabaseAdmin().from("messages").insert({
      conversation_id: conversationId,
      role: "system",
      content: "WINDOW_EXPIRED: Message received outside the 24h window — no reply sent.",
    });
    // Mark conversation so the dashboard can surface this to the workspace owner
    await getSupabaseAdmin()
      .from("conversations")
      .update({ status: "human_takeover", updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    return;
  }

  // ── Load chat history ────────────────────────────────────────────────────────
  const { data: history } = await getSupabaseAdmin()
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  // ── Generate AI reply with Gemini ────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(chatbotConfig, workspace?.name ?? "La Boutique");

  let replyText = "";
  try {
    const model = getGenAI().getGenerativeModel(
      {
        model: GEMINI_MODEL,
        systemInstruction: systemPrompt,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
      }
    );

    // Build Gemini chat history (exclude the last user message — passed as current turn)
    const chatHistory = (history ?? [])
      .slice(0, -1)
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(messageText);
    replyText = result.response.text();
  } catch (err) {
    console.error("[Meta Webhook] Gemini error:", String(err));
    await getSupabaseAdmin().from("messages").insert({
      conversation_id: conversationId,
      role: "system",
      content: `GEMINI_ERROR: ${String(err)}`,
    });
    replyText = "أهلاً! راني نشوف ليك، نتواصل معاك قريباً إن شاء الله 🙏";
  }

  await saveAndSend({ conversationId, senderId, accessToken, integration, replyText });
}

// ─── Save reply to DB + send via Meta Graph API ───────────────────────────────
async function saveAndSend({
  conversationId,
  senderId,
  accessToken,
  integration,
  replyText,
}: {
  conversationId: string;
  senderId: string;
  accessToken: string;
  integration: { type: string; credentials: Record<string, string> };
  replyText: string;
}) {
  await getSupabaseAdmin().from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: replyText,
  });

  try {
    // Instagram and Messenger both use the Facebook Graph API endpoint for sending messages
    const sendUrl = integration.type === "instagram"
      ? `https://graph.facebook.com/v21.0/me/messages`
      : `https://graph.facebook.com/v21.0/me/messages`;

    const graphRes = await fetch(`${sendUrl}?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: replyText },
        messaging_type: "RESPONSE",
      }),
    });

    const sendResult = await graphRes.json();
    if (!graphRes.ok) {
      console.error("[Meta Webhook] Graph API send error:", JSON.stringify(sendResult));

      // Detect 24h window error from Meta's response
      const errorCode = sendResult?.error?.code;
      const errorSubcode = sendResult?.error?.error_subcode;
      if (errorCode === 10 || errorSubcode === 2018278 || errorSubcode === 2018109) {
        await getSupabaseAdmin().from("messages").insert({
          conversation_id: conversationId,
          role: "system",
          content: "WINDOW_EXPIRED: Meta rejected the reply — 24h window has closed.",
        });
        await getSupabaseAdmin()
          .from("conversations")
          .update({ status: "human_takeover", updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      } else {
        await getSupabaseAdmin().from("messages").insert({
          conversation_id: conversationId,
          role: "system",
          content: `SEND_ERROR: ${JSON.stringify(sendResult)}`,
        });
      }
    }
  } catch (err) {
    console.error("[Meta Webhook] Failed to send reply:", err);
  }
}
