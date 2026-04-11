import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genAI, detectLanguage, buildSystemPrompt } from "@/lib/claude";
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

  // Build Gemini chat history (role must be "user" or "model")
  const chatHistory = (history ?? [])
    .filter((m: { role: string; content: string }) => m.role !== "system")
    .map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Stream Gemini response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt,
        });

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessageStream(content);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        // Save assistant message after stream completes
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
