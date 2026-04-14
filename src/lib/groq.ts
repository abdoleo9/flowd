import Groq from "groq-sdk";

export const GROQ_MODEL = "llama-3.3-70b-versatile";

// Lazy singleton — only instantiated at runtime, not build time
let _groq: Groq | null = null;
export function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
  }
  return _groq;
}

// Keep named export for backward compat
export { detectLanguage, buildSystemPrompt } from "./claude";
export type { ChatbotConfig } from "./claude";
