import Groq from "groq-sdk";
import type { ChatbotConfig, StyleProfile } from "./claude";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_MODEL = "llama-3.3-70b-versatile";

export { detectLanguage, buildSystemPrompt } from "./claude";
export type { ChatbotConfig, StyleProfile };
