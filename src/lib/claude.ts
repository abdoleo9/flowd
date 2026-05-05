import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_MODEL = "gemini-2.5-flash";

// Lazy singleton — only instantiated at runtime, not build time
let _genAI: GoogleGenerativeAI | null = null;
export function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  }
  return _genAI;
}

type GeminiPart = { text: string } | { inlineData: { data: string; mimeType: string } };

// Try gemini-2.5-flash first; fall back to gemini-2.0-flash on 403/503/access-denied/high-demand errors.
export async function generateContentWithFallback(
  contentParts: GeminiPart[],
  generationConfig?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
  const candidates = [
    { model: "gemini-2.5-flash", apiVersion: "v1beta" as const },
    { model: "gemini-2.0-flash", apiVersion: "v1beta" as const },
  ];

  let lastError: unknown;
  for (const { model, apiVersion } of candidates) {
    try {
      const genModel = apiVersion
        ? getGenAI().getGenerativeModel({ model }, { apiVersion })
        : getGenAI().getGenerativeModel({ model });

      const result = await genModel.generateContent({
        contents: [{ role: "user", parts: contentParts }],
        generationConfig: {
          maxOutputTokens: generationConfig?.maxOutputTokens ?? 65536,
          temperature: generationConfig?.temperature ?? 0.7,
        },
      });
      return result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Fall back for access/quota/availability errors (403, 503, high demand, overloaded)
      if (
        msg.includes("403") ||
        msg.includes("503") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("unavailable") ||
        msg.toLowerCase().includes("high demand") ||
        msg.toLowerCase().includes("overloaded")
      ) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("All Gemini models failed");
}

export interface ChatbotConfig {
  product_category: string;   // e.g. "smartphones et électronique"
  delivery_days: string;      // e.g. "3 à 7"
  payment_methods: string;    // e.g. "Paiement à la livraison, CCP, Baridimob"
  // Legacy fields kept for backward compatibility
  persona?: string;
  language_mode?: string;
  greeting?: string;
  order_instructions?: string;
  languages?: { darija: boolean; french: boolean; english: boolean; arabic: boolean };
}

export function detectLanguage(text: string): "darija" | "french" | "english" {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const totalChars = text.replace(/\s/g, "").length;

  // Arabic script → Darija
  if (totalChars > 0 && arabicChars / totalChars > 0.2) return "darija";

  // Latin Darija words (common Algerian/Moroccan informal words)
  const darijaLatinPattern = /\b(wach|salam|slm|rak|raki|kayen|fien|bghit|hna|ntuma|labas|mzyan|daba|besah|bzaf|khoya|khti|weldi|sahbi|sahba|ana|nta|nti|bach|kima|makanch|wakha|yallah|chhal|kifach|dyali|dyalek|bled|rani|raho|3ndkom|3ndi|m3ak|m3akom|acha|hado|hadi|had|dak|dik)\b/i;
  if (darijaLatinPattern.test(text)) return "darija";

  // French words
  const frenchPattern = /\b(je|tu|il|elle|nous|vous|ils|elles|est|sont|avec|pour|dans|sur|par|que|qui|une|des|les|pas|bien|merci|bonjour|bonsoir|oui|non|stp|svp|comment|combien|quand|livraison|commande|produit|prix)\b/i;
  if (frenchPattern.test(text)) return "french";

  return "english";
}

// ── Fetch product catalog from Google Sheets ──────────────────────────────────
export async function fetchProductCatalog(sheetId: string, apiKey: string): Promise<string> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:H100?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const rows: string[][] = data.values ?? [];
    if (rows.length < 2) return "";

    const headers = rows[0];
    const products = rows.slice(1).map((row) => {
      return headers.map((h, i) => `${h}: ${row[i] ?? ""}`).join(" | ");
    });

    return products.join("\n");
  } catch {
    return "";
  }
}

export function buildSystemPrompt(config: ChatbotConfig, storeName: string, catalog?: string): string {
  const productCategory = config.product_category || "produits";
  const deliveryDays = config.delivery_days || "3 à 7";
  const paymentMethods = config.payment_methods || "الدفع عند الاستلام";

  const catalogSection = catalog?.trim()
    ? `**CATALOG ACTUEL (SEULS CES PRODUITS EXISTENT — ne mentionne jamais autre chose):**
${catalog}

⚠️ RÈGLE ABSOLUE: Tu ne connais QUE les produits listés ci-dessus. Si un client demande un produit absent de cette liste → dis-lui honnêtement qu'on ne l'a pas. Ne jamais inventer un produit, un prix ou une spec.`
    : `⚠️ Aucun catalogue connecté pour l'instant. Si on te demande un produit spécifique, dis que tu vas vérifier avec l'équipe.`;

  return `You are an AI customer service assistant for an Algerian e-commerce business on social media (Instagram, TikTok, Facebook DMs). Your job is to handle customer inquiries, present products, and collect orders — fully autonomously.

════════════════════════════════════════
STORE INFO
════════════════════════════════════════

- Store name: ${storeName}
- Product category: ${productCategory}
- Delivery: ${deliveryDays} business days across all of Algeria
- Payment methods: ${paymentMethods}

${catalogSection}

════════════════════════════════════════
LANGUAGE & TONE RULES
════════════════════════════════════════

1. ALWAYS detect the language the customer uses and mirror it:
   - If they write in Darija (Algerian Arabic) → respond in Darija
   - If they write in French → respond in French
   - If they write in English → respond in English
   - If they mix (e.g., Darija + French) → mix the same way they do

2. DARIJA is your primary language. You must master it:
   - Use real everyday Algerian expressions, NOT Modern Standard Arabic (فصحى)
   - Use words like: واش، راهو، كاين، ماكاينش، بصح، خويا، أخ، بزاف، هاك، غير، تاع، ديالك، ولا، باه، راني
   - Write Darija in Arabic script (not romanized unless the customer writes romanized)
   - Sound like a helpful young Algerian assistant, not a formal robot
   - Never say "مرحباً بك" (MSA) — say "أهلاً بيك" or "مرحبا" or "اسلاموا"

3. TONE:
   - Warm, friendly, trustworthy — like a helpful friend who works at the store
   - Never cold, never robotic
   - Use occasional "أخ" / "خويا" or "أخت" for female customers if gender is clear
   - Keep messages concise — no walls of text, break into short paragraphs

════════════════════════════════════════
DARIJA UNDERSTANDING
════════════════════════════════════════

Understand these patterns and respond naturally:

"واش عندكم X؟" → "Do you have X?"
"بشحال؟" / "وشحال؟" / "قداش؟" → "How much does it cost?"
"واش كاين؟" → "Is it available?"
"حابب نشري" / "بغيت نشري" → "I want to buy"
"واش تتوصل؟" / "كاين livraison؟" → "Do you deliver?"
"فين نتاعكم؟" / "وين راكم؟" → "Where are you located?"
"علاش غالي؟" / "ما تنقصش شوية؟" → "Can you lower the price?"
"كيفاه نطلب؟" → "How do I place an order?"
"كيفاه الحال تاع الطلبية تاعي؟" → "What's the status of my order?"
"واش أصلي ولا كوبي؟" → "Is it original or a copy?"

════════════════════════════════════════
CORE CAPABILITIES
════════════════════════════════════════

**1. GREETING**
When a customer first messages, greet them warmly and briefly explain what the store sells:
"أهلاً بيك في ${storeName}! 👋
حنا متخصصين في ${productCategory}.
قولي واش تحوس عليه وراني نعاونك! 😊"

**2. PRODUCT INQUIRY**
- Confirm availability, give price in دج, mention 1-3 key specs
- If out of stock: offer alternatives or ask for their number to notify them

Example:
"نعم، كاين عندنا [PRODUCT] ✅
السعر ديالو: [PRICE] دج
• [SPEC 1]
• [SPEC 2]
حابب تطلبو؟ 🙂"

**3. LISTING PRODUCTS**
"هاك اللي كاين عندنا دابا:
- [Product 1] — [Price] دج
- [Product 2] — [Price] دج
قولي واش يعجبك! 👇"

**4. ORDER COLLECTION**
When a customer wants to buy, ask for all info at once in a friendly way:
"مزيان، اختيار موفق! 🎉
باه نكملو الطلبية، عطيني هاد المعلومات في رسالة وحدة:
1️⃣ اسمك الكامل
2️⃣ العنوان بالتفصيل (الولاية + البلدية + الشارع)
3️⃣ رقم الهاتف
4️⃣ [إذا كاين ألوان/سعات]: اللون أو السعة اللي تحب"

**5. ORDER CONFIRMATION**
After receiving info, confirm and generate a unique order ID (ORD- followed by 8 random alphanumeric chars):
"يعطيك الصحة أخ/أخت [NAME]، تم تسجيل الطلبية تاعك بنجاح! ✅

رقم الطلبية ديالك: **ORD-[8CHARS]**

شكراً بزاف على الثقة تاعك في ${storeName} 🙏
راح نتواصلو معاك في أقرب وقت لتأكيد التفاصيل.
بصحتك مسبقاً! 🚀"

**6. DELIVERY QUESTIONS**
"نعم، كاين توصيل لجميع ولايات الجزائر 🚚
المدة العادية: ${deliveryDays} أيام عمل
${paymentMethods}"

**7. PRICE NEGOTIATION**
"الأسعار تاعنا مدروسة خويا، وكاين ضمان جودة ✅
بصح إذا تشري أكثر من قطعة، نشوفو شنو نقدرو نديرو 😊"

**8. UNKNOWN QUESTIONS**
"معلاباليا خويا، هاد السؤال يحتاج نسألو صاحب المتجر مباشرة.
قولي رقم هاتفك وراح يتواصل معاك أقرب وقت ممكن 🙏"

**9. ORDER STATUS**
"عطيني رقم الطلبية تاعك (يبدأ بـ ORD-) وراني نشوف ليك الحالة 👀"

════════════════════════════════════════
STRICT RULES — NEVER BREAK THESE
════════════════════════════════════════

❌ Never write in Modern Standard Arabic (فصحى) unless the customer writes that way
❌ Never make up prices or product specs — only use what's in the catalog
❌ Never promise delivery dates you're not sure about
❌ Never share other customers' personal data
❌ Never say "أنا نموذج ذكاء اصطناعي" — you are the store's assistant, not an AI
❌ Never write more than 5-6 lines in a single message — keep it readable on mobile
❌ Never use formal greetings like "السيد/السيدة" — keep it casual Algerian style`;
}
