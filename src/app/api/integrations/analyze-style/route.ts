import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/lib/active-workspace";
import { getGroq, GROQ_MODEL } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  // ── Find a connected Instagram or Messenger integration ───────────────────
  const { data: integrations } = await supabase
    .from("integrations")
    .select("type, credentials")
    .eq("workspace_id", workspaceId)
    .in("type", ["instagram", "messenger"])
    .eq("is_active", true);

  if (!integrations?.length) {
    return NextResponse.json({ error: "Aucune intégration Instagram ou Messenger connectée" }, { status: 400 });
  }

  const integration = integrations[0];
  const creds = integration.credentials as Record<string, string>;
  const accessToken = creds.access_token;
  const pageId = creds.page_id;

  if (!accessToken || !pageId) {
    return NextResponse.json({ error: "Token ou Page ID manquant dans l'intégration" }, { status: 400 });
  }

  // ── Try fetching conversations from Instagram Graph API ───────────────────
  const ownerMessages: string[] = [];

  try {
    // Instagram User Token works on graph.instagram.com
    const convUrl = `https://graph.instagram.com/v21.0/${pageId}/conversations?fields=messages{message,from,created_time}&limit=30&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(convUrl);
    const data = await res.json();

    if (!data.error) {
      const conversations = data.data ?? [];
      for (const conv of conversations) {
        const msgs = conv.messages?.data ?? [];
        for (const msg of msgs) {
          if (msg.from?.id === pageId && msg.message?.trim()) {
            ownerMessages.push(msg.message.trim());
          }
        }
      }
    }
  } catch {
    // Will fall through to DB fallback
  }

  // ── Fallback: use manual replies already stored in Supabase ───────────────
  if (ownerMessages.length < 3) {
    const { data: dbMessages } = await supabase
      .from("messages")
      .select("content, conversations!inner(workspace_id, channel)")
      .eq("conversations.workspace_id", workspaceId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(80);

    const dbTexts = (dbMessages ?? [])
      .map((m: { content: string }) => m.content)
      .filter((t: string) => t && !t.startsWith("GROQ_ERROR") && !t.startsWith("GEMINI_ERROR") && !t.startsWith("SEND_ERROR") && t.length > 10);

    ownerMessages.push(...dbTexts);
  }

  if (ownerMessages.length < 3) {
    return NextResponse.json({
      error: "Pas assez de messages trouvés pour analyser votre style. Continuez à répondre à vos clients puis réessayez.",
    }, { status: 400 });
  }

  // Cap at 80 messages to keep the prompt manageable
  const sample = ownerMessages.slice(0, 80);

  // ── Ask Gemini to analyze the communication style ─────────────────────────
  const analysisPrompt = `Tu es un expert en analyse de style d'écriture pour le commerce en ligne algérien.

Voici ${sample.length} messages réels envoyés par le propriétaire d'une boutique e-commerce algérienne à ses clients :

${sample.map((m, i) => `${i + 1}. "${m}"`).join("\n")}

Analyse ces messages et génère un profil de style d'écriture précis. Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans \`\`\`) avec cette structure exacte :
{
  "tone": "description courte du ton (ex: chaleureux et informel, professionnel, amical, etc.)",
  "languages": ["liste des langues/dialectes utilisés, ex: darija, français, arabe"],
  "greeting_style": "comment il salue ses clients (exemple réel)",
  "confirmation_style": "comment il confirme les commandes (exemple réel)",
  "emoji_usage": "description de l'usage des emojis (ex: utilise souvent ❤️ et 🙏, rarement, etc.)",
  "common_phrases": ["jusqu'à 6 expressions ou phrases typiques qu'il utilise souvent"],
  "style_instructions": "2-3 phrases d'instructions directes pour qu'un chatbot IA imite exactement ce style. Commence par 'Tu dois...' et soit très précis sur le ton, les expressions et la façon de confirmer les commandes.",
  "sample_count": ${sample.length}
}`;

  let styleProfile: Record<string, unknown>;
  try {
    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: analysisPrompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });
    const text = (completion.choices[0]?.message?.content ?? "").trim();
    const clean = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    styleProfile = JSON.parse(clean);
  } catch (err) {
    console.error("Groq analysis error:", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse IA" }, { status: 500 });
  }

  // ── Save style profile to workspace chatbot_config ────────────────────────
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("chatbot_config")
    .eq("id", workspaceId)
    .single();

  const currentConfig = (workspace?.chatbot_config as Record<string, unknown>) ?? {};
  const updatedConfig = {
    ...currentConfig,
    style_profile: styleProfile,
    style_analyzed_at: new Date().toISOString(),
    style_source: integration.type,
  };

  const { error: saveError } = await supabase
    .from("workspaces")
    .update({ chatbot_config: updatedConfig })
    .eq("id", workspaceId);

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: styleProfile });
}
