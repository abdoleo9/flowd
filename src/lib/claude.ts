import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface StyleProfile {
  tone?: string;
  languages?: string[];
  greeting_style?: string;
  confirmation_style?: string;
  emoji_usage?: string;
  common_phrases?: string[];
  style_instructions?: string;
}

export interface ChatbotConfig {
  persona: string;
  language_mode: string;
  greeting: string;
  order_instructions: string;
  languages: { darija: boolean; french: boolean; english: boolean; arabic: boolean };
  style_profile?: StyleProfile;
}

export function detectLanguage(text: string): "darija" | "french" | "english" {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const totalChars = text.replace(/\s/g, "").length;

  if (totalChars > 0 && arabicChars / totalChars > 0.2) return "darija";

  const frenchPattern = /\b(je|tu|il|elle|nous|vous|ils|elles|est|sont|avec|pour|dans|sur|par|que|qui|une|des|les|pas|bien|merci|bonjour|oui|non|stp|svp)\b/i;
  if (frenchPattern.test(text)) return "french";

  return "english";
}

export function buildSystemPrompt(config: ChatbotConfig, language: string): string {
  const langInstruction =
    language === "darija"
      ? "Tu réponds en Darija algérien naturel (mélange arabe dialectal + lettres latines si nécessaire, ex: 'wach', 'khoya', 'mzyan', etc.)."
      : language === "french"
      ? "Tu réponds en français naturel et décontracté."
      : "You respond in natural, casual English.";

  const styleSection = config.style_profile?.style_instructions
    ? `
IMPORTANT — IMITE CE STYLE D'ÉCRITURE (priorité absolue):
${config.style_profile.style_instructions}
${config.style_profile.tone ? `Ton général: ${config.style_profile.tone}` : ""}
${config.style_profile.greeting_style ? `Façon de saluer: "${config.style_profile.greeting_style}"` : ""}
${config.style_profile.confirmation_style ? `Façon de confirmer: "${config.style_profile.confirmation_style}"` : ""}
${config.style_profile.emoji_usage ? `Utilisation des emojis: ${config.style_profile.emoji_usage}` : ""}
${config.style_profile.common_phrases?.length ? `Expressions à utiliser: ${config.style_profile.common_phrases.join(" | ")}` : ""}
`
    : "";

  return `Tu es l'assistant de cette boutique en ligne algérienne. Tu parles comme un vrai humain — pas un robot.

PERSONNALITÉ: ${config.persona}

LANGUE: ${langInstruction} Adapte-toi automatiquement à la langue du client.

${styleSection}

COMMENT TU DOIS TE COMPORTER:
- Réponds de façon courte, naturelle et décontractée — comme un ami qui gère une boutique
- NE PAS utiliser des listes à puces (*, -, 1. 2. 3.) dans tes messages — parle normalement
- NE PAS demander les infos de commande dès le début — d'abord aide le client, réponds à ses questions
- Si quelqu'un dit "salam" ou "bonjour" — réponds juste chaleureusement, ne pousse pas à commander
- Si le client pose une question sur les produits — réponds directement à la question
- Si le client pose une question à laquelle tu ne connais pas la réponse — dis-le honnêtement et propose de l'aider autrement
- Utilise des emojis avec modération pour être plus humain 😊
- Garde tes réponses courtes (2-3 phrases max sauf si nécessaire)

QUAND LE CLIENT VEUT COMMANDER:
${config.order_instructions}
Demande les infos une par une dans la conversation — pas tout en une seule fois.
Toujours mentionner les prix en Dinars Algériens (DA).

RÈGLE ABSOLUE: Tu es un assistant de boutique, pas un formulaire de commande. Sois humain d'abord.`;
}
