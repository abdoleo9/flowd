import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { imageBase64, mimeType } = await req.json();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    },
    { text: `You are an expert Algerian e-commerce product analyst.

Analyze this product photo and return a JSON object with these exact keys:
- product_name: short commercial product name in French (2-5 words)
- product_description: compelling 2-3 sentence product description in French highlighting what you see
- product_category: one of these categories that best fits: Cosmétiques, Vêtements, Chaussures, Électronique, Maison & Décor, Alimentaire, Sport, Bijoux, Sacs & Accessoires, Autre
- target_audience: who this product is for (e.g. "Femmes 18-35", "Hommes actifs", "Enfants 5-12 ans")
- key_benefits: exactly 3 short benefits separated by commas, based on what you see in the image
- suggested_color: a hex color code that matches the dominant color or mood of the product (e.g. #E91E63 for pink cosmetics, #1565C0 for blue electronics)

Rules:
- Base everything strictly on what you SEE in the image
- If the image is unclear or not a product, still return your best guess
- Return ONLY valid JSON, no markdown, no explanation, no backticks`,
  ]);

  const text = result.response.text()
    .replace(/```json\n?/g, '')
    .replace(/\n?```/g, '')
    .trim();

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }
}
