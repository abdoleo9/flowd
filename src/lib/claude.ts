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

  // Arabic script → Darija
  if (totalChars > 0 && arabicChars / totalChars > 0.2) return "darija";

  // Latin Darija words (common Algerian/Moroccan informal words)
  const darijaLatinPattern = /\b(wach|wach|salam|slm|rak|raki|kayen|fien|bghit|hna|ntuma|labas|mzyan|daba|besah|bzaf|khoya|khti|weldi|sahbi|sahba|ana|nta|nti|bach|kima|makanch|wakha|yallah|chhal|kifach|dyali|dyalek|bled|rani|raho|f'halna|3ndkom|3ndi|m3ak|m3akom|acha|hado|hadi|had|dak|dik)\b/i;
  if (darijaLatinPattern.test(text)) return "darija";

  // French words
  const frenchPattern = /\b(je|tu|il|elle|nous|vous|ils|elles|est|sont|avec|pour|dans|sur|par|que|qui|une|des|les|pas|bien|merci|bonjour|bonsoir|oui|non|stp|svp|comment|combien|quand|livraison|commande|produit|prix)\b/i;
  if (frenchPattern.test(text)) return "french";

  return "english";
}

export function buildSystemPrompt(config: ChatbotConfig, language: string): string {
  // Language rule — stated in the detected language itself so the LLM can't ignore it
  const langRule =
    language === "darija"
      ? "⚠️ RÈGLE #1 ABSOLUE: Le client écrit en Darija algérien. Tu DOIS répondre en Darija algérien (mélange arabe + latin naturel). Jamais en français seul. Jamais en anglais."
      : language === "french"
      ? "⚠️ RÈGLE #1 ABSOLUE: Le client écrit en français. Tu DOIS répondre en français. Jamais en anglais."
      : "⚠️ RULE #1 ABSOLUTE: The customer is writing in English. You MUST respond in English. Never in French. Never in Arabic.";

  const styleSection = config.style_profile?.style_instructions
    ? `
━━━ TON STYLE D'ÉCRITURE (copie exactement ce style — c'est la voix du propriétaire) ━━━
${config.style_profile.style_instructions}
Ton: ${config.style_profile.tone ?? "chaleureux"}
Salutation typique: "${config.style_profile.greeting_style ?? ""}"
Confirmation typique: "${config.style_profile.confirmation_style ?? ""}"
Emojis: ${config.style_profile.emoji_usage ?? "modérément"}
Expressions à réutiliser: ${config.style_profile.common_phrases?.join(" | ") ?? ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    : "";

  return `${langRule}

Tu es l'assistant de cette boutique algérienne. Tu représentes le propriétaire — parle comme lui, avec sa chaleur et son style.

PERSONNALITÉ DU PROPRIÉTAIRE: ${config.persona}
${styleSection}

COMMENT TU TE COMPORTES:
- Tu es chaleureux, accueillant, et humain — pas un robot
- Quand quelqu'un dit salam/bonjour/hello → réponds chaleureusement, demande comment tu peux l'aider
- Réponds directement aux questions du client avant de parler de commande
- Messages courts et naturels (2-3 phrases max) — jamais de listes à puces
- Si tu ne sais pas quelque chose → dis-le honnêtement
- Utilise quelques emojis pour paraître humain ❤️

QUAND LE CLIENT VEUT COMMANDER:
${config.order_instructions}
→ Demande les infos une par une, naturellement dans la conversation
→ Prix toujours en Dinars Algériens (DA)

RAPPEL FINAL: ${langRule}`;
}
