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

  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';
  const primaryColor = color_theme || '#1a1a2e';

  const t = {
    orderNow: isArabic ? 'اطلب الآن' : 'Commander maintenant',
    learnMore: isArabic ? 'اكتشف المزيد' : 'En savoir plus',
    ourBenefits: isArabic ? 'مميزاتنا' : 'Nos avantages',
    aboutProduct: isArabic ? 'عن المنتج' : 'À propos du produit',
    howItWorks: isArabic ? 'كيف يعمل' : 'Comment ça marche',
    testimonials: isArabic ? 'آراء عملائنا' : 'Avis clients',
    orderSection: isArabic ? 'اطلب الآن' : 'Passer une commande',
    fullName: isArabic ? 'الاسم الكامل' : 'Nom complet',
    phone: isArabic ? 'رقم الهاتف' : 'Numéro de téléphone',
    wilayaLabel: isArabic ? 'الولاية' : 'Wilaya',
    commune: isArabic ? 'البلدية / العنوان' : 'Commune / Adresse',
    quantity: isArabic ? 'الكمية' : 'Quantité',
    notes: isArabic ? 'ملاحظات' : 'Remarques',
    submit: isArabic ? 'تأكيد الطلب' : 'Confirmer la commande',
    sending: isArabic ? 'جارٍ الإرسال...' : 'Envoi en cours...',
    success: isArabic ? '✅ تم استلام طلبك! سنتواصل معك قريباً' : '✅ Commande reçue ! Nous vous contacterons bientôt.',
    required: isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs obligatoires',
    error: isArabic ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'Une erreur est survenue, veuillez réessayer',
    poweredBy: 'Powered by Flowd',
    freeDelivery: isArabic ? 'توصيل مجاني' : 'Livraison gratuite',
    authentic: isArabic ? 'منتج أصلي' : 'Produit authentique',
    guarantee: isArabic ? 'ضمان 30 يوم' : 'Garantie 30 jours',
    customers: isArabic ? 'عميل راضٍ' : 'clients satisfaits',
    rating: isArabic ? 'تقييم' : 'Note',
    delivery: isArabic ? 'توصيل سريع' : 'Livraison rapide',
    step1: isArabic ? 'اختر المنتج' : 'Choisissez',
    step2: isArabic ? 'أدخل بياناتك' : 'Remplissez le formulaire',
    step3: isArabic ? 'استلم طلبك' : 'Recevez votre commande',
    step1Desc: isArabic ? 'اختر الكمية المطلوبة' : 'Sélectionnez votre quantité',
    step2Desc: isArabic ? 'أدخل اسمك ورقم هاتفك وعنوانك' : 'Entrez vos coordonnées et adresse',
    step3Desc: isArabic ? 'سيصلك الطلب في أقرب وقت' : 'Livraison rapide à votre porte',
    selectWilaya: isArabic ? 'اختر الولاية' : 'Choisir la wilaya',
    home: isArabic ? 'الرئيسية' : 'Accueil',
    about: isArabic ? 'عن المنتج' : 'À propos',
    reviews: isArabic ? 'التقييمات' : 'Avis',
    contact: isArabic ? 'تواصل معنا' : 'Contact',
    priceLabel: isArabic ? 'السعر:' : 'Prix :',
    daUnit: 'DA',
  };

  const prompt = `
You are a world-class web designer creating a premium, high-converting product landing page for an Algerian e-commerce brand.
Your designs are featured on Dribbble. The output must look like a real professional product page — not a template.
${imageBase64 ? 'A real product photo is provided. Use it as the hero image and in the product section. It MUST appear prominently.' : 'No product photo provided. Use a styled CSS placeholder with the primary color.'}

PRODUCT:
- Name: ${product_name}
- Description: ${product_description}
- Price: ${product_price} DA
- Category: ${product_category}
- Target audience: ${target_audience}
- Key benefits: ${key_benefits}
- Primary color: ${primaryColor}
- Language/direction: ${isArabic ? 'Arabic RTL' : 'French LTR'} — all text must be in ${isArabic ? 'Arabic (Modern Standard + Darija touch)' : 'French'}

═══════════════════════════════════════
DESIGN SYSTEM (MUST follow exactly)
═══════════════════════════════════════

CSS VARIABLES to define in :root {
  --primary: ${primaryColor};
  --primary-light: ${primaryColor}18;  /* 10% opacity version */
  --primary-mid: ${primaryColor}33;    /* 20% opacity version */
  --text: #111111;
  --text-muted: #6b7280;
  --bg: #ffffff;
  --bg-soft: #f9fafb;
  --border: #e5e7eb;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-md: 0 8px 32px rgba(0,0,0,0.10);
  --radius: 14px;
  --radius-sm: 8px;
}

TYPOGRAPHY:
- Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Hero headline: font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em
- Section titles: font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700
- Body: 1rem / 1.7 line-height; color: var(--text-muted)
- Price display: font-size: 2rem; font-weight: 800; color: var(--primary)

SPACING: use generous whitespace — section padding: 80px 0; container max-width: 1200px; margin: 0 auto; padding: 0 24px

═══════════════════════════════════════
PAGE STRUCTURE (all 9 sections, in order)
═══════════════════════════════════════

── 1. STICKY NAVBAR ──────────────────
position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 0 24px; height: 64px
Layout: flex; justify-content: space-between; align-items: center
- LEFT: Brand name in bold (use product_name shortened or initials as logo mark)
- CENTER: 4 nav links (${t.home}, ${t.about}, ${t.reviews}, ${t.contact}) — hidden on mobile
- RIGHT: A filled button "Commander" (${primaryColor} background, white text, border-radius: 50px, padding: 10px 24px)

── 2. HERO SECTION ───────────────────
min-height: 88vh; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center
${imageBase64 ? `
Product image display:
- RIGHT column: the product image must be shown using: <img src="data:${mimeType};base64,[USE_THE_PROVIDED_IMAGE_DATA]" ...>
  Style it with: width: 100%; max-width: 520px; border-radius: 24px; object-fit: cover;
  Wrap it in a div with background: var(--primary-light); border-radius: 32px; padding: 32px; position: relative
  Add a decorative circle behind: position absolute, width: 400px, height: 400px, background: var(--primary-mid), border-radius: 50%, z-index: 0, top: 50%, transform: translateY(-50%)
` : `
- RIGHT column: A CSS-only product mockup — large rounded square (aspect-ratio: 1; background: linear-gradient(135deg, var(--primary-light), var(--primary-mid)); border-radius: 32px; display: flex; align-items: center; justify-content: center) with the product name initials in a very large font (5rem, color: var(--primary))
`}
LEFT column:
- Small tag above headline: "✨ ${product_category}" — pill style (background: var(--primary-light); color: var(--primary); border-radius: 50px; padding: 6px 16px; font-size: 0.85rem; font-weight: 600; display: inline-block; margin-bottom: 20px)
- H1: 2-line headline derived from product_name and main benefit — make it punchy and emotional
- Subheadline: 25-35 word description tailored from product_description
- Price badge: large price display + "DA" unit, then "/ unité" or "/ وحدة"
- TWO buttons side by side:
  * Primary: background: var(--primary); color: white; padding: 16px 32px; border-radius: 50px; font-size: 1.1rem; font-weight: 700; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; onclick: document.getElementById('order-form').scrollIntoView({behavior:'smooth'})
  * Secondary: background: transparent; color: var(--primary); border: 2px solid var(--primary); same padding; onclick: document.getElementById('about').scrollIntoView({behavior:'smooth'})
- Trust row below buttons: flex row of 3 items (🚚 ${t.freeDelivery} · ✅ ${t.authentic} · 🛡️ ${t.guarantee}) — font-size: 0.85rem; color: var(--text-muted); margin-top: 24px; gap: 24px

── 3. SOCIAL PROOF BAR ───────────────
Full-width; background: var(--bg-soft); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 28px 0
4 stats in a row (flex, justify-content: center, gap: 60px):
Each stat: { number in bold (1.8rem, var(--primary)), label below (0.85rem, var(--text-muted)) }
Stats to generate (make realistic numbers based on product_category):
1. "1 000+" + "${t.customers}"
2. "★ 4.8" + "${t.rating}"
3. "48h" + "${t.delivery}"
4. "100%" + "${isArabic ? 'أصالة مضمونة' : 'Qualité garantie'}"

── 4. BENEFITS SECTION ───────────────
id="benefits"; text-align: center; padding: 80px 0; background: var(--bg)
- Section label (small caps, var(--primary), letter-spacing: 0.1em): "${isArabic ? 'لماذا نحن' : 'POURQUOI NOUS'}"
- Section title: "${t.ourBenefits}"
- 3 cards in CSS grid (grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px)
Each card: background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px 28px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; hover: transform: translateY(-4px), box-shadow: var(--shadow-md)
  - Emoji icon in a circle: width: 64px; height: 64px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.8rem
  - Bold title (1.1rem, font-weight: 700)
  - Description (0.9rem, var(--text-muted))
Generate 3 benefits from key_benefits — each with a relevant emoji

── 5. ABOUT PRODUCT SECTION ──────────
id="about"; padding: 80px 0; background: var(--bg-soft)
2-column grid (1fr 1fr, gap: 60px, align-items: center)
${imageBase64 ? `LEFT: Product image again (same img tag as hero) styled with border-radius: 20px; box-shadow: var(--shadow-md); width: 100%` : `LEFT: CSS placeholder box with decorative pattern (repeating-linear-gradient dots)`}
RIGHT:
- Section label (small, primary color, uppercase)
- H2: "${t.aboutProduct}"
- Paragraph from product_description (2-3 sentences)
- Features list: 4-5 bullet points from key_benefits
  Each: display flex; gap: 12px; margin-bottom: 12px
  Icon: a small circle (24px) with "✓" — background: var(--primary); color: white; border-radius: 50%; font-size: 0.7rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center
- CTA button (same primary style as hero)

── 6. HOW IT WORKS ───────────────────
padding: 80px 0; background: var(--bg); text-align: center
Section title: "${t.howItWorks}"
3 steps in flex row (justify-content: center; gap: 0; position: relative)
Add connecting line between steps: use a horizontal rule or pseudo-element
Each step:
  - Number badge: 52px circle, background: var(--primary), color: white, font-size: 1.4rem, font-weight: 800
  - Step title (bold, 1rem)
  - Step description (0.85rem, muted)
  - Arrow between steps (except last): "→" in primary color
Steps: 1) "${t.step1}" — "${t.step1Desc}" · 2) "${t.step2}" — "${t.step2Desc}" · 3) "${t.step3}" — "${t.step3Desc}"

── 7. TESTIMONIALS ───────────────────
id="reviews"; padding: 80px 0; background: var(--bg-soft)
Section title: "${t.testimonials}"
3 cards in grid (repeat(3,1fr), gap: 24px)
Each card: background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-sm)
Structure:
  - Stars: "★★★★★" in var(--primary), font-size: 1.1rem, margin-bottom: 16px
  - Review text: italic, 0.95rem, color: var(--text), margin-bottom: 20px — write realistic 2-3 sentence Algerian customer review in ${isArabic ? 'Arabic' : 'French'} that mentions specific benefit of the product
  - Customer row: flex, gap: 12px, align-items: center
    * Avatar: 44px circle, background: var(--primary-light), color: var(--primary), font-weight: 700, font-size: 1rem, display: flex, align-items: center, justify-content: center — show 2-letter initials
    * Name + city: name in bold 0.9rem, city in 0.8rem muted — use realistic Algerian names (e.g. Amira K., Mohamed B., Sara L., Karim M., Nadia H., Yacine T.) and Algerian cities (Alger, Oran, Constantine, Annaba, Tizi Ouzou, Blida, Sétif)

── 8. ORDER FORM SECTION ─────────────
id="order-form-section"; padding: 80px 0; background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg) 100%)
Section title centered: "${t.orderSection}"
Inner container: 2-column grid (1fr 1.3fr, gap: 48px, align-items: start)
LEFT — product summary card:
  background: white; border-radius: var(--radius); padding: 32px; box-shadow: var(--shadow-md)
  - Product name in bold (1.3rem)
  - Price in primary color (2rem, font-weight: 800)
  - 3 key benefits as bullet list
  - Trust badges row: 🔒 ${isArabic ? 'دفع آمن عند الاستلام' : 'Paiement à la livraison'}, 🚚 ${t.freeDelivery}, ✅ ${t.guarantee}
RIGHT — the order form (id="order-form"):
  background: white; border-radius: var(--radius); padding: 36px; box-shadow: var(--shadow-md)
  Field style: width: 100%; padding: 14px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem; margin-top: 6px; transition: border-color 0.2s; outline: none; focus: border-color: var(--primary)
  Label style: font-weight: 600; font-size: 0.85rem; color: var(--text); display: block
  Fields (each wrapped in a div.form-group with margin-bottom: 20px):
  1. customer_name — text, required — label: "${t.fullName}"
  2. customer_phone — tel, required — label: "${t.phone}"
  3. wilaya — select, required — label: "${t.wilayaLabel}" — option value="" disabled selected: "${t.selectWilaya}" — then all 58 wilayas: Adrar, Chlef, Laghouat, Oum El Bouaghi, Batna, Béjaïa, Biskra, Béchar, Blida, Bouira, Tamanrasset, Tébessa, Tlemcen, Tiaret, Tizi Ouzou, Alger, Djelfa, Jijel, Sétif, Saïda, Skikda, Sidi Bel Abbès, Annaba, Guelma, Constantine, Médéa, Mostaganem, M'Sila, Mascara, Ouargla, Oran, El Bayadh, Illizi, Bordj Bou Arréridj, Boumerdès, El Tarf, Tindouf, Tissemsilt, El Oued, Khenchela, Souk Ahras, Tipaza, Mila, Aïn Defla, Naâma, Aïn Témouchent, Ghardaïa, Relizane, El M'Ghair, El Menia, Ouled Djellal, Bordj Baji Mokhtar, Béni Abbès, Timimoun, Touggourt, Djanet, In Salah, In Guezzam
  4. commune — text, required — label: "${t.commune}"
  5. quantity — number, min=1, value=1, required — label: "${t.quantity}"
  6. notes — textarea rows=3, optional — label: "${t.notes}"
  7. Submit button (id="submit-btn"): full-width; background: var(--primary); color: white; padding: 18px; border: none; border-radius: var(--radius-sm); font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; hover: opacity: 0.9
     onclick: window.submitFlowdOrder()

── 9. FOOTER ─────────────────────────
background: #111; color: #aaa; padding: 40px 24px
3-column grid:
  - LEFT: Brand name (white, bold), tagline (1 sentence, muted)
  - CENTER: Quick links (same 4 as navbar)
  - RIGHT: Contact info (a phone placeholder, an email placeholder)
Bottom bar: border-top: 1px solid #333; margin-top: 32px; padding-top: 20px; text-align: center
  "${t.poweredBy}" — font-size: 0.85rem; color: #555

═══════════════════════════════════════
JAVASCRIPT (exact, verbatim)
═══════════════════════════════════════

<script>
window.PAGE_SLUG = '${slug}';

window.submitFlowdOrder = async function() {
  const form = document.getElementById('order-form');
  const btn = document.getElementById('submit-btn');
  const data = {
    customer_name: form.customer_name.value.trim(),
    customer_phone: form.customer_phone.value.trim(),
    wilaya: form.wilaya.value,
    commune: form.commune.value.trim(),
    quantity: parseInt(form.quantity.value) || 1,
    notes: form.notes ? form.notes.value.trim() : '',
  };
  if (!data.customer_name || !data.customer_phone || !data.wilaya || !data.commune) {
    alert('${t.required}');
    return;
  }
  btn.disabled = true;
  btn.textContent = '${t.sending}';
  try {
    const res = await fetch('/api/landing-pages/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, page_slug: window.PAGE_SLUG })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('order-form').innerHTML = '<div style="text-align:center;padding:60px 20px"><div style="font-size:3rem;margin-bottom:16px">✅</div><p style="font-size:1.2rem;font-weight:700;color:#111">${t.success}</p></div>';
    } else {
      btn.disabled = false;
      btn.textContent = '${t.submit}';
      alert('${t.error}');
    }
  } catch(e) {
    btn.disabled = false;
    btn.textContent = '${t.submit}';
  }
};

// Scroll-triggered fade-in animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
</script>

Add this CSS for fade-in:
.fade-in { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
.fade-in.visible { opacity: 1; transform: none; }
Apply class="fade-in" to: each benefit card, each testimonial card, the about section columns, the how-it-works steps.

═══════════════════════════════════════
FINAL RULES
═══════════════════════════════════════
- The HTML document must start with <!DOCTYPE html> and include <html lang="${isArabic ? 'ar' : 'fr'}" dir="${dir}">
- All CSS in one <style> tag in <head> — no external resources
- ${imageBase64 ? `The product image tag must use: src="data:${mimeType};base64,${imageBase64}" — embed it verbatim` : 'No external images — use CSS placeholders only'}
- All text in ${isArabic ? 'Arabic' : 'French'} — no mixing languages
- Mobile responsive: at max-width 768px, all grids collapse to single column; navbar hides center links; hero image moves below text
- Valid HTML, no syntax errors
- Return ONLY the raw HTML. No markdown fences, no explanation, no backtick blocks.
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let html_content: string;
  try {
    type Part = { text: string } | { inlineData: { data: string; mimeType: string } };
    const contentParts: Part[] = [];
    if (imageBase64 && mimeType) {
      contentParts.push({ inlineData: { data: imageBase64, mimeType } });
    }
    contentParts.push({ text: prompt });

    const result = await model.generateContent(contentParts);
    html_content = result.response.text()
      .replace(/^```html\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${msg}` }, { status: 500 });
  }

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
