import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getGenAI, GEMINI_MODEL, detectLanguage, buildSystemPrompt, fetchProductCatalog } from "@/lib/claude";
import { getActiveWorkspaceId } from "@/lib/active-workspace";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { conversationId, content } = body;

  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get workspace + chatbot config
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("chatbot_config, name")
    .eq("id", workspaceId)
    .single();

  // Load last 20 messages for history
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  // Detect language
  const language = detectLanguage(content);

  // Update conversation language
  await supabase
    .from("conversations")
    .update({ language_detected: language, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  // Save user message
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content,
  });

  const chatbotConfig = workspace?.chatbot_config ?? {
    product_category: "produits",
    delivery_days: "3 à 7",
    payment_methods: "الدفع عند الاستلام",
  };

  // Fetch product catalog from Google Sheets if integration is connected
  let catalog = "";
  const { data: sheetsIntegration } = await supabase
    .from("integrations")
    .select("credentials")
    .eq("workspace_id", workspaceId)
    .eq("type", "google_sheets")
    .eq("is_active", true)
    .maybeSingle();

  if (sheetsIntegration?.credentials) {
    const creds = sheetsIntegration.credentials as Record<string, string>;
    if (creds.sheet_id && creds.api_key) {
      catalog = await fetchProductCatalog(creds.sheet_id, creds.api_key);
    }
  }

  const systemPrompt = buildSystemPrompt(chatbotConfig, workspace?.name ?? "La Boutique", catalog);

  // Build Gemini chat history (role: "user" | "model")
  const geminiHistory = (history ?? [])
    .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
    .map((m: { role: string; content: string }) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    }));

  // Stream Gemini response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const model = getGenAI().getGenerativeModel({
          model: GEMINI_MODEL,
          systemInstruction: systemPrompt,
        });
        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessageStream(content);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: fullResponse,
        });

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
