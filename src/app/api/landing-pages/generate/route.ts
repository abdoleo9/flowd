import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    workspace_id,
    product_name,
    product_description,
    product_price,
    product_category,
    target_audience,
    key_benefits,
    color_theme,
    language,
    imageBase64,
    mimeType,
  } = body;

  const slug = `${product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  const imageInstruction = imageBase64
    ? `\nA product photo has been provided. Use it to make the design and descriptions more accurate and visually consistent with the actual product.`
    : '';

  const prompt = `
You are an expert conversion-rate optimizer and web designer specializing in Algerian e-commerce.
Generate a complete, self-contained single-product landing page in HTML.
${imageInstruction}

PRODUCT DETAILS:
- Name: ${product_name}
- Description: ${product_description}
- Price: ${product_price} DA
- Category: ${product_category}
- Target audience: ${target_audience}
- Key benefits: ${key_benefits}
- Primary color: ${color_theme || '#2563EB'}
- Language: ${language === 'ar' ? 'Arabic (Darija/Modern Standard)' : 'French'}

REQUIREMENTS — follow ALL of these exactly:

1. The page must be a single complete HTML file with all CSS inlined in a <style> tag.
2. Design: Mobile-first, modern, high-converting. Dark or light theme your choice — make it feel premium.
3. Sections to include (in order):
   a. Hero — product name, bold headline, price badge, primary CTA button ("Commander maintenant" / "اطلب الآن")
   b. Benefits — 3 icons + short benefit descriptions (use emoji as icons, no external resources)
   c. Product details — description, features list
   d. Testimonials — 3 fake but realistic Algerian customer reviews with Arabic names
   e. Order form — see exact spec below
   f. Footer — "Powered by Flowd" text

4. ORDER FORM (critical — this must be exact):
   The form must have id="order-form" and these fields:
   - customer_name (text, required) — "Nom complet" / "الاسم الكامل"
   - customer_phone (tel, required) — "Numéro de téléphone" / "رقم الهاتف"
   - wilaya (select, required) — dropdown of all 58 Algerian wilayas by name
   - commune (text, required) — "Commune / Adresse" / "البلدية / العنوان"
   - quantity (number, min=1, default=1) — "Quantité" / "الكمية"
   - notes (textarea, optional) — "Remarques" / "ملاحظات"
   - A submit button with id="submit-btn" that calls window.submitFlowdOrder() — do NOT use a native form submit

5. Include this exact JavaScript at the bottom of the <body>:

   <script>
   window.submitFlowdOrder = async function() {
     const form = document.getElementById('order-form');
     const btn = document.getElementById('submit-btn');
     const data = {
       customer_name: form.customer_name.value,
       customer_phone: form.customer_phone.value,
       wilaya: form.wilaya.value,
       commune: form.commune.value,
       quantity: parseInt(form.quantity.value) || 1,
       notes: form.notes.value,
     };
     if (!data.customer_name || !data.customer_phone || !data.wilaya || !data.commune) {
       alert('${language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs obligatoires'}');
       return;
     }
     btn.disabled = true;
     btn.textContent = '${language === 'ar' ? 'جارٍ الإرسال...' : 'Envoi en cours...'}';
     try {
       const res = await fetch('/api/landing-pages/order', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...data, page_slug: window.PAGE_SLUG })
       });
       const result = await res.json();
       if (result.success) {
         document.getElementById('order-form').innerHTML = '<div style="text-align:center;padding:40px;font-size:24px;">${language === 'ar' ? '✅ تم استلام طلبك! سنتواصل معك قريباً' : '✅ Commande reçue ! Nous vous contacterons bientôt'}</div>';
       } else {
         btn.disabled = false;
         btn.textContent = '${language === 'ar' ? 'اطلب الآن' : 'Commander maintenant'}';
         alert('${language === 'ar' ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'Une erreur est survenue, veuillez réessayer'}');
       }
     } catch(e) {
       btn.disabled = false;
       btn.textContent = '${language === 'ar' ? 'اطلب الآن' : 'Commander maintenant'}';
     }
   };
   </script>
   <script>window.PAGE_SLUG = '${slug}';</script>

6. No external fonts, no external CSS frameworks, no images (use gradients and CSS shapes instead).
7. The total HTML must be valid and render perfectly standalone in a browser.
8. Make it genuinely beautiful and conversion-optimized — not a template, not generic.

Return ONLY the raw HTML. No markdown, no explanation, no backticks.
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const contentParts: (string | { inlineData: { data: string; mimeType: string } })[] = [];

  if (imageBase64 && mimeType) {
    contentParts.push({ inlineData: { data: imageBase64, mimeType } });
  }
  contentParts.push(prompt);

  const result = await model.generateContent(contentParts);
  const html_content = result.response.text()
    .replace(/^```html\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  const { data: page, error } = await supabase
    .from('landing_pages')
    .insert({
      workspace_id,
      slug,
      product_name,
      product_description,
      product_price,
      html_content,
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ page, slug });
}
