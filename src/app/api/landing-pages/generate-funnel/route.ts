import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase/server';
import { getGenAI } from '@/lib/claude';
import { WILAYAS } from '@/constants/wilayas';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function nanoid6(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    product_name,
    product_description,
    product_price,
    original_price,
    discount_label,
    product_category,
    key_benefits,
    how_it_works,
    urgency_stock,
    delivery_days,
    delivery_free,
    testimonials,
    language,
    color_primary,
    image_base64,
    image_mime_type,
    workspace_id,
  } = body;

  // Required field validation
  if (!product_name || !product_description || !product_price || !product_category ||
      !key_benefits?.length || !delivery_days || !workspace_id) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const isAr = language === 'ar';
  const primary = (color_primary as string) || '#E63946';
  const slug = `${slugify(product_name as string)}-${nanoid6()}`;

  // Upload image to CDN if provided
  let image_url: string | null = null;
  if (image_base64 && image_mime_type) {
    try {
      const svc = getSupabaseServiceClient();
      const ext = (image_mime_type as string).split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
      const fileName = `funnel-${slug}-${Date.now()}.${ext}`;
      const buffer = Buffer.from(image_base64 as string, 'base64');
      const { error: uploadError } = await svc.storage
        .from('landing-page-images')
        .upload(fileName, buffer, { contentType: image_mime_type as string, upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = svc.storage
          .from('landing-page-images')
          .getPublicUrl(fileName);
        image_url = publicUrl;
      }
    } catch {
      // fall through, no image in HTML
    }
  }

  // Hero image element
  const heroImgStyle = `width:100%;height:100%;object-fit:cover;border-radius:0`;
  const heroImg = image_url
    ? `<img src="${image_url}" alt="${product_name}" style="${heroImgStyle}" loading="lazy">`
    : image_base64 && image_mime_type
    ? `<img src="data:${image_mime_type};base64,${image_base64}" alt="${product_name}" style="${heroImgStyle}" loading="lazy">`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${primary}33,${primary}88);display:flex;align-items:center;justify-content:center;font-size:5rem;color:${primary}">${(product_name as string).charAt(0).toUpperCase()}</div>`;

  // Small thumbnail for order form
  const thumbImg = image_url
    ? `<img src="${image_url}" alt="${product_name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:12px;">`
    : image_base64 && image_mime_type
    ? `<img src="data:${image_mime_type};base64,${image_base64}" alt="${product_name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:12px;">`
    : '';

  // Wilaya options
  const wilayaOptions = WILAYAS.map(
    w => `<option value="${w.code}">${w.code} - ${w.name}</option>`
  ).join('\n');

  // Price display
  const priceBlock = original_price
    ? `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-size:2.2rem;font-weight:900;color:${primary}">${product_price} DA</span>
        <span style="font-size:1.1rem;text-decoration:line-through;color:#666">${original_price} DA</span>
        ${discount_label ? `<span style="background:${primary};color:#fff;padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:700">${discount_label}</span>` : ''}
       </div>`
    : `<div style="font-size:2.2rem;font-weight:900;color:${primary}">${product_price} DA</div>`;

  const benefitsList = (key_benefits as string[]).map(b => `• ${b}`).join('\n');

  const howItWorksSection = (how_it_works as string[] | undefined)?.length
    ? (how_it_works as string[]).map((step, i) =>
        `<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:12px;">
          <span style="min-width:36px;height:36px;border-radius:50%;background:${primary};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1rem;color:#fff">${i + 1}</span>
          <span style="color:#eee;font-size:0.95rem;line-height:1.5">${step}</span>
        </div>`
      ).join('')
    : '';

  const urgencyHtml = urgency_stock
    ? `<div style="animation:pulse 1.5s infinite;font-size:1.3rem;font-weight:900;color:#fff">
        ${isAr ? `⚠️ تبقى فقط ${urgency_stock} قطعة!` : `⚠️ Plus que ${urgency_stock} en stock !`}
       </div>`
    : '';

  const deliveryHtml = isAr
    ? `الطلبات تُسلَّم خلال ${delivery_days}${delivery_free ? ' — التوصيل مجاني 🚚' : ''}`
    : `Livraison en ${delivery_days}${delivery_free ? ' — Gratuite 🚚' : ''}`;

  const trustMicro = isAr
    ? `✅ دفع عند الاستلام | 🚚 توصيل ${delivery_days} | ↩️ ضمان استرداد الأموال`
    : `✅ Paiement à la livraison | 🚚 Livraison ${delivery_days} | ↩️ Retour garanti`;

  const testimonialsNote = (testimonials as unknown[] | undefined)?.length
    ? `Use these exact testimonials: ${JSON.stringify(testimonials)}`
    : `Generate 4 realistic Algerian testimonials for a "${product_category}" product. Use Algerian first names and cities (Alger, Oran, Constantine, Annaba, Tizi Ouzou, Sétif, Blida, Batna, Béjaïa, Tlemcen).`;

  const prompt = `You are an expert Algerian e-commerce conversion copywriter and front-end developer.
Generate a complete single-file HTML sales funnel page for the Algerian market.

OUTPUT RULES:
- Output ONLY raw HTML starting with <!DOCTYPE html>. No markdown. No explanation. No code fences.
- Everything must be inline: all CSS in <style> inside <head>, all JS in <script> at bottom of <body>
- No external CDN links, no Google Fonts imports, use system fonts only
- The page must be fully mobile-first and responsive (primary target: max-width 480px)
- Direction: ${isAr ? 'RTL (dir="rtl")' : 'LTR (dir="ltr")'}
- ALL text must be in ${isAr ? 'Arabic' : 'French'} language ONLY — no mixing languages
- Font stack Arabic: 'Segoe UI', Tahoma, Arial, sans-serif
- Font stack French: system-ui, -apple-system, 'Segoe UI', sans-serif

PRODUCT INFO:
- Name: ${product_name}
- Description: ${product_description}
- Price: ${product_price} DA${original_price ? `\n- Original price (crossed out): ${original_price} DA` : ''}${discount_label ? `\n- Discount label: ${discount_label}` : ''}
- Category: ${product_category}
- Key benefits:
${benefitsList}${(how_it_works as string[] | undefined)?.length ? `\n- How it works: ${(how_it_works as string[]).join(' → ')}` : ''}
- Delivery: ${delivery_days}${delivery_free ? ' (FREE delivery)' : ''}${urgency_stock ? `\n- Only ${urgency_stock} units left in stock` : ''}

DESIGN SYSTEM (mandatory — do not deviate):
- Primary/CTA color: ${primary}
- Background: #0a0a0a
- Card background: #141414
- Text primary: #ffffff
- Text secondary: #aaaaaa
- Star color: #FFD700
- Urgency/badge: #ff4444
- Border: 1px solid rgba(255,255,255,0.08)
- Border radius cards: 12px
- CTA button: large, full-width, background:${primary}, color:#fff, font-weight:900, border-radius:8px, padding:18px, font-size:1.1rem, box-shadow:0 4px 24px ${primary}55, border:none, cursor:pointer, transition:opacity 0.2s
- All inputs/selects: background:#1e1e1e, color:#fff, border:1px solid rgba(255,255,255,0.15), border-radius:8px, padding:12px 16px, font-size:0.95rem, width:100%, box-sizing:border-box, focus border:${primary}
- Horizontal scroll areas: scrollbar-width:none; -ms-overflow-style:none and ::-webkit-scrollbar{display:none}
- html{scroll-behavior:smooth}
- @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
- Fade-in: .fi{opacity:0;transform:translateY(20px);transition:opacity 0.6s ease,transform 0.6s ease} .fi.visible{opacity:1;transform:none}

PAGE SECTIONS — generate ALL 9 in order:

1. TOP BAR (sticky, z-index:100, background:#0a0a0a, backdrop-filter:blur(12px), border-bottom:1px solid rgba(255,255,255,0.08), height:52px, display:flex, align-items:center, justify-content:space-between, padding:0 16px)
   - ${isAr ? 'Right' : 'Left'}: brand circle (40px circle, background:${primary}22, color:${primary}, font-weight:900, display:flex, align-items:center, justify-content:center, border-radius:50%, font-size:1rem) showing "${(product_name as string).charAt(0).toUpperCase()}"
   - Center: product name truncated (overflow:hidden, text-overflow:ellipsis, white-space:nowrap, max-width:180px, font-size:0.85rem, color:#ccc)
   - ${isAr ? 'Left' : 'Right'}: small CTA button (background:${primary}, color:#fff, border:none, border-radius:6px, padding:8px 14px, font-size:0.8rem, font-weight:700, cursor:pointer) with text "${isAr ? 'اطلب الآن' : 'Commander'}" onclick scrolls to #order-form

2. HERO SECTION (position:relative, overflow:hidden, max-height:480px, min-height:300px)
   - Full-width product image container: width:100%, height:400px, overflow:hidden, position:relative
   - INJECT THIS IMAGE HTML EXACTLY AS-IS:
${heroImg}
   - Bottom gradient overlay: position:absolute, bottom:0, left:0, right:0, height:200px, background:linear-gradient(transparent,#0a0a0a), pointer-events:none
   - Star rating badge (position:absolute, top:16px, ${isAr ? 'right' : 'left'}:16px, background:rgba(0,0,0,0.75), backdrop-filter:blur(8px), border-radius:20px, padding:6px 12px, font-size:0.8rem, color:#FFD700): "⭐ 4.8/5 (+5000 ${isAr ? 'تقييم' : 'avis'})"
   - Below image (padding:20px 16px, background:#0a0a0a):
     * AI-written emotional headline: bold, font-size:clamp(1.4rem,5vw,2rem), color:#fff, line-height:1.3, margin-bottom:8px — make it punchy and specific to the product
     * Sub-headline: 1 sentence promise, color:#aaa, font-size:0.95rem, margin-bottom:16px
     * Price block: ${priceBlock}

3. TRUST BAR (background:#111, border-top:1px solid rgba(255,255,255,0.08), border-bottom:1px solid rgba(255,255,255,0.08), padding:12px 0, overflow-x:auto, scrollbar-width:none)
   - Inner flex row (display:flex, gap:0, min-width:max-content, padding:0 16px)
   - 4 items, each: padding:0 20px, border-right:1px solid rgba(255,255,255,0.08), display:flex, align-items:center, gap:8px, font-size:0.8rem, color:#ccc, white-space:nowrap
   - Items: ✅ ${isAr ? `توصيل ${delivery_days}` : `Livraison ${delivery_days}`} | 🔒 ${isAr ? 'دفع عند الاستلام' : 'Paiement à la livraison'} | ↩️ ${isAr ? 'ضمان استرداد' : 'Retour garanti'} | ⭐ +5000 ${isAr ? 'عميل راضٍ' : 'clients satisfaits'}

4. BENEFITS SECTION (id="benefits", padding:40px 16px, class="fi")
   - Section title: font-size:1.3rem, font-weight:800, color:#fff, margin-bottom:24px, text-align:center — "${isAr ? `لماذا تختار ${product_name}؟` : `Pourquoi choisir ${product_name} ?`}"
   - Grid of benefit cards (display:grid, grid-template-columns:1fr 1fr on mobile, gap:12px)
   - Each card (background:#141414, border:1px solid rgba(255,255,255,0.08), border-radius:12px, padding:16px, display:flex, flex-direction:column, gap:8px):
     * Emoji icon in 40px circle (background:${primary}22, border-radius:50%, display:flex, align-items:center, justify-content:center, font-size:1.3rem, width:40px, height:40px)
     * Benefit title: font-weight:700, color:#fff, font-size:0.9rem
     * Benefit description: color:#aaa, font-size:0.8rem, line-height:1.5
   - Generate ${(key_benefits as string[]).length} cards from these benefits: ${benefitsList}
   - Pick relevant emojis for each benefit

${(how_it_works as string[] | undefined)?.length ? `5. HOW IT WORKS (id="how-it-works", padding:40px 16px, background:#111, class="fi")
   - Section title: font-size:1.3rem, font-weight:800, color:#fff, margin-bottom:20px — "${isAr ? 'كيف يعمل؟' : 'Comment ça marche ?'}"
   - Steps list (inject these exact steps with styled containers):
${howItWorksSection}` : `5. HOW IT WORKS — OMIT this section entirely (no data provided)`}

6. URGENCY BLOCK (background:linear-gradient(135deg,#1a0000,#2d0000), border:1px solid #ff444433, border-radius:12px, margin:0 16px, padding:24px, text-align:center, class="fi")
${urgencyHtml ? `   - Stock line: ${urgencyHtml}` : '   - No stock urgency line (omit stock count)'}
   - Delivery: font-size:0.95rem, color:#ffaaaa, margin-top:8px — "${deliveryHtml}"
   - CTA button (same style as main CTA): "${isAr ? 'اطلب الآن قبل نفاد الكميات 🛒' : 'Commander avant rupture de stock 🛒'}" onclick scrolls to #order-form

7. TESTIMONIALS SECTION (id="testimonials", padding:40px 16px)
   - Section title: font-size:1.3rem, font-weight:800, color:#fff, margin-bottom:20px — "${isAr ? 'ماذا قال عملاؤنا' : 'Ce que disent nos clients'}"
   - Horizontal scroll container (display:flex, overflow-x:auto, gap:12px, padding-bottom:8px, scrollbar-width:none)
   - 4 cards, each (min-width:260px, background:#141414, border:1px solid rgba(255,255,255,0.08), border-radius:12px, padding:20px, flex-shrink:0):
     * Stars: color:#FFD700, font-size:1rem, margin-bottom:8px
     * Comment: color:#ddd, font-size:0.9rem, line-height:1.6, margin-bottom:16px, font-style:italic
     * Customer row (display:flex, align-items:center, gap:10px):
       - Avatar circle (width:38px, height:38px, border-radius:50%, background:${primary}33, color:${primary}, font-weight:700, display:flex, align-items:center, justify-content:center, font-size:0.85rem, flex-shrink:0): first 2 letters of name
       - Name (font-weight:700, color:#fff, font-size:0.85rem) + city (color:#888, font-size:0.8rem)
   - ${testimonialsNote}

8. ORDER FORM SECTION (id="order-form", padding:40px 16px, background:#111)
   - Top: product name (font-size:1.1rem, font-weight:800, color:#fff, margin-bottom:8px)
${thumbImg ? `   - Product thumbnail: ${thumbImg}` : ''}
   - Price display: ${priceBlock}
   - Form card (background:#141414, border:1px solid rgba(255,255,255,0.08), border-radius:12px, padding:20px, margin-top:20px):
     <form id="funnel-order-form">
     Each field wrapper: margin-bottom:16px
     Label style: display:block, color:#ccc, font-size:0.85rem, font-weight:600, margin-bottom:6px

     Field 1: customer_name (type:text, required, placeholder:"${isAr ? 'محمد أحمد' : 'Mohamed Ahmed'}") — label: "${isAr ? 'الاسم الكامل' : 'Nom complet'}"
     Field 2: customer_phone (type:tel, required, placeholder:"05XXXXXXXX") — label: "${isAr ? 'رقم الهاتف' : 'Numéro de téléphone'}"
     Field 3: wilaya (select, required) — label: "${isAr ? 'الولاية' : 'Wilaya'}"
       First option: <option value="" disabled selected>${isAr ? 'اختر الولاية' : 'Choisir la wilaya'}</option>
       Then all 58 wilayas:
${wilayaOptions}
     Field 4: commune (type:text, required, placeholder:"${isAr ? 'اسم البلدية' : 'Nom de la commune'}") — label: "${isAr ? 'البلدية' : 'Commune'}"
     Field 5: quantity (type:number, min:1, max:10, value:1, id:"qty-input") — label: "${isAr ? 'الكمية' : 'Quantité'}" — onchange calls updateTotal()
     Field 6: notes (textarea, rows:3, placeholder:"${isAr ? 'أي طلبات خاصة...' : 'Demandes spéciales...'}") — label: "${isAr ? 'ملاحظات (اختياري)' : 'Notes (optionnel)'}"
     </form>

     Price summary block (margin:20px 0, padding:16px, background:#1e1e1e, border-radius:8px):
     - Row: "${isAr ? 'المنتج × الكمية' : 'Produit × quantité'}" → <span id="subtotal-display">${product_price} DA</span>
     - Row: "${isAr ? 'التوصيل' : 'Livraison'}" → "${delivery_free ? (isAr ? 'مجاني 🎁' : 'Gratuit 🎁') : `${isAr ? 'عند التسليم' : 'À confirmer'}`}"
     - Total row (border-top:1px solid rgba(255,255,255,0.1), margin-top:12px, padding-top:12px, font-weight:900, color:${primary}, font-size:1.2rem):
       "${isAr ? 'المجموع' : 'Total'}" → <span id="total-display">${product_price} DA</span>

     CTA button (id="funnel-submit-btn", onclick="submitFunnelOrder()" — full CTA style):
     "${isAr ? 'اطلب الآن 🛒' : 'Commander maintenant 🛒'}"

     Trust micro-copy (text-align:center, color:#888, font-size:0.75rem, margin-top:10px):
     "${trustMicro}"

9. FOOTER (background:#111, border-top:1px solid rgba(255,255,255,0.08), padding:32px 16px, text-align:center)
   - Store name: "Flowd Store" (font-size:1rem, font-weight:700, color:#fff, margin-bottom:8px)
   - Tagline: color:#666, font-size:0.8rem — "${isAr ? 'جميع الحقوق محفوظة © 2025' : 'Tous droits réservés © 2025'}"
   - Social row (display:flex, justify-content:center, gap:16px, margin-top:16px):
     Instagram SVG icon (24px, color:#E1306C): <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
     Facebook SVG icon (24px, color:#1877F2): <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>

JAVASCRIPT (place in <script> at end of <body>):
const PAGE_SLUG = "${slug}";
const UNIT_PRICE = ${product_price};

function updateTotal() {
  const qty = parseInt(document.getElementById('qty-input').value) || 1;
  const sub = qty * UNIT_PRICE;
  document.getElementById('subtotal-display').textContent = sub + ' DA';
  document.getElementById('total-display').textContent = sub + ' DA';
}

async function submitFunnelOrder() {
  const form = document.getElementById('funnel-order-form');
  const btn = document.getElementById('funnel-submit-btn');
  const name = form.customer_name.value.trim();
  const phone = form.customer_phone.value.trim();
  const wilaya = form.wilaya.value;
  const commune = form.commune.value.trim();
  const quantity = parseInt(form.quantity.value) || 1;
  const notes = form.notes ? form.notes.value.trim() : '';
  if (!name || !phone || !wilaya || !commune) {
    alert('${isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs obligatoires'}');
    return;
  }
  btn.disabled = true;
  btn.textContent = '${isAr ? 'جارٍ الإرسال...' : 'Envoi en cours...'}';
  try {
    const r = await fetch('/api/landing-pages/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: name, customer_phone: phone, wilaya, commune, quantity, notes, page_slug: PAGE_SLUG })
    });
    const res = await r.json();
    if (res.success) {
      const orderSection = document.getElementById('order-form');
      orderSection.innerHTML = '<div style="text-align:center;padding:60px 20px"><div style="font-size:4rem">✅</div><p style="font-size:1.3rem;font-weight:800;color:#fff;margin-top:20px">${isAr ? 'تم استلام طلبك!' : 'Commande reçue !'}</p><p style="color:#aaa;margin-top:8px;font-size:0.9rem">${isAr ? 'سنتواصل معك قريباً لتأكيد الطلب' : 'Nous vous contacterons bientôt pour confirmer'}</p></div>';
    } else {
      btn.disabled = false;
      btn.textContent = '${isAr ? 'اطلب الآن 🛒' : 'Commander maintenant 🛒'}';
      const errEl = document.getElementById('funnel-err');
      if (errEl) errEl.textContent = '${isAr ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'Une erreur est survenue, veuillez réessayer'}';
    }
  } catch {
    btn.disabled = false;
    btn.textContent = '${isAr ? 'اطلب الآن 🛒' : 'Commander maintenant 🛒'}';
  }
}

// Fade-in via IntersectionObserver
const obs = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) e.target.classList.add('visible');
}), { threshold: 0.1 });
document.querySelectorAll('.fi').forEach(el => obs.observe(el));

// Sticky top bar CTA → scroll to order form
document.querySelectorAll('[data-scroll-order]').forEach(el => {
  el.addEventListener('click', () => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' }));
});`;

  const model = getGenAI().getGenerativeModel(
    { model: 'gemini-2.5-flash' },
    { apiVersion: 'v1beta' }
  );

  let html_content: string;
  try {
    type Part = { text: string } | { inlineData: { data: string; mimeType: string } };
    const contentParts: Part[] = [];
    if (image_base64 && image_mime_type) {
      contentParts.push({ inlineData: { data: image_base64 as string, mimeType: image_mime_type as string } });
    }
    contentParts.push({ text: prompt });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: contentParts }],
      generationConfig: { maxOutputTokens: 65536, temperature: 0.7 },
    });

    html_content = result.response.text()
      .replace(/^```html\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${msg}` }, { status: 500 });
  }

  // Save to DB
  const svc = getSupabaseServiceClient();
  const { data: page, error: insertError } = await svc
    .from('landing_pages')
    .insert({
      workspace_id,
      slug,
      product_name,
      product_description,
      product_price,
      product_images: image_url ? [image_url] : [],
      html_content,
      status: 'active',
      generation_config: {
        mode: 'funnel',
        language: language ?? 'fr',
        color_primary: primary,
        product_category,
        original_price: original_price ?? null,
        discount_label: discount_label ?? null,
        funnel_key_benefits: key_benefits,
        how_it_works: how_it_works ?? null,
        urgency_stock: urgency_stock ?? null,
        delivery_days,
        delivery_free: delivery_free ?? false,
        testimonials: testimonials ?? null,
      },
    })
    .select('id, slug')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé. Veuillez réessayer.' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ slug: page.slug, url: `/p/${page.slug}` });
}
