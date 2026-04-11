import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getGroq, GROQ_MODEL, detectLanguage, buildSystemPrompt } from "@/lib/groq";
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
    .select("chatbot_config")
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
    persona: "Assistant sympathique",
    language_mode: "auto",
    greeting: "Marhba!",
    order_instructions: "Demande le nom, téléphone, wilaya et adresse.",
    languages: { darija: true, french: true, english: true, arabic: false },
  };

  const systemPrompt = buildSystemPrompt(chatbotConfig, language);

  // Build messages for Groq (OpenAI-compatible)
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...(history ?? [])
      .filter((m: { role: string }) => m.role !== "system")
      .map((m: { role: string; content: string }) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      })),
    { role: "user", content },
  ];

  // Stream Groq response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await getGroq().chat.completions.create({
          model: GROQ_MODEL,
          messages,
          max_tokens: 500,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
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
