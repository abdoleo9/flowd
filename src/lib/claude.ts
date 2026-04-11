import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!, {
  // Use stable v1 API instead of v1beta
  httpOptions: { apiVersion: "v1" },
} as object);

interface StyleProfile {
  tone?: string;
  languages?: string[];
  greeting_style?: string;
  confirmation_style?: string;
  emoji_usage?: string;
  common_phrases?: string[];
  style_instructions?: string;
}

interface ChatbotConfig {
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
      ? "Réponds en Darija algérien (arabe dialectal algérien, tu peux mélanger lettres latines et arabes)."
      : language === "french"
      ? "Réponds en français."
      : "Respond in English.";

  const styleSection = config.style_profile?.style_instructions
    ? `
STYLE D'ÉCRITURE (PRIORITÉ ABSOLUE — imite exactement le propriétaire de la boutique):
${config.style_profile.style_instructions}
${config.style_profile.tone ? `Ton: ${config.style_profile.tone}` : ""}
${config.style_profile.greeting_style ? `Salutation typique: "${config.style_profile.greeting_style}"` : ""}
${config.style_profile.confirmation_style ? `Confirmation typique: "${config.style_profile.confirmation_style}"` : ""}
${config.style_profile.emoji_usage ? `Emojis: ${config.style_profile.emoji_usage}` : ""}
${config.style_profile.common_phrases?.length ? `Expressions à réutiliser: ${config.style_profile.common_phrases.join(" | ")}` : ""}
`
    : "";

  return `Tu es un assistant chatbot pour une boutique e-commerce algérienne.

PERSONNALITÉ: ${config.persona}

LANGUE: ${langInstruction} Détecte automatiquement la langue du client et réponds dans la même langue.
${styleSection}
INSTRUCTIONS DE PRISE DE COMMANDE:
${config.order_instructions}

RÈGLES:
- Toujours mentionner les prix en Dinars Algériens (DA ou دج)
- Si le client veut commander, demander: nom complet, numéro de téléphone, wilaya, adresse, produit(s)
- Si tu ne peux pas répondre, propose de transférer à un agent humain
- Sois concis, amical et professionnel
- Ne partage pas d'informations confidentielles sur l'entreprise`;
}
