import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase/server';
import { generateContentWithFallback } from '@/lib/claude';
import { generateFunnelProductImages } from '@/lib/fal';
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
    language,
    color_primary,
    image_base64,
    image_mime_type,
    workspace_id,
  } = body;

  if (!product_name || !product_description || !product_price || !product_category ||
      !key_benefits?.length || !delivery_days || !workspace_id) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const svc = getSupabaseServiceClient();
  const isAr = language === 'ar';
  const primary = (color_primary as string) || '#16A34A';
  const slug = `${slugify(product_name as string)}-${nanoid6()}`;
  const currentYear = new Date().getFullYear();

  // Fetch workspace name for topbar / footer
  const { data: workspace } = await svc
    .from('workspaces')
    .select('name')
    .eq('id', workspace_id)
    .single();
  const workspaceName = (workspace?.name as string | undefined) || 'Flowd Store';
  const shortName = workspaceName.slice(0, 20);

  // Upload original image to CDN
  let image_url: string | null = null;
  if (image_base64 && image_mime_type) {
    try {
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
      // non-blocking, continue without CDN image
    }
  }

  // Generate fal.ai variant images using the CDN URL (fal.ai requires HTTP/HTTPS, not data: URLs)
  let variantImages: (string | null)[] = [null, null, null];
  if (image_url) {
    try {
      variantImages = await generateFunnelProductImages(
        image_url,
        product_name as string,
        product_category as string
      );
    } catch (err) {
      console.error('Image generation failed, continuing without variants:', err);
    }
  }

  // Hero uses fal.ai white-bg studio variant if available, falls back to original CDN image
  const heroSrc = variantImages[0] ?? image_url ?? null;

  const heroImgHtml = heroSrc
    ? `<img src="${heroSrc}" alt="${product_name}" style="width:100%;max-height:380px;object-fit:contain;background:#FFFFFF;padding:16px;display:block;" loading="lazy">`
    : `<div style="width:100%;height:280px;background:linear-gradient(135deg,${primary}33,${primary}88);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:${primary};padding:16px;text-align:center;">${product_name}</div>`;

  // Variant image elements for injection into prompt
  const variant1Html = variantImages[0]
    ? `<img src="${variantImages[0]}" alt="${product_name}" style="width:100%;max-height:200px;object-fit:contain;border-radius:10px;margin-bottom:16px;background:#F9FAFB;padding:8px;display:block;">`
    : '';
  const variant2Html = variantImages[1]
    ? `<img src="${variantImages[1]}" alt="${product_name}" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:16px;display:block;">`
    : '';
  const variant3Html = variantImages[2]
    ? `<img src="${variantImages[2]}" alt="${product_name}" style="width:100%;max-height:180px;object-fit:contain;border-radius:10px;margin-bottom:16px;background:#fff;padding:8px;display:block;">`
    : '';

  // Compute discount if not provided
  const computedDiscount = (original_price && product_price)
    ? Math.round((1 - (Number(product_price) / Number(original_price))) * 100)
    : null;
  const discountText = (discount_label as string | undefined) || (computedDiscount ? `-${computedDiscount}%` : '');

  // Wilaya options HTML
  const wilayaOptionsHtml = WILAYAS
    .map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`)
    .join('\n');

  // How it works section — only if 3 steps provided
  const howItWorksSteps = (how_it_works as string[] | undefined)?.filter(s => s?.trim()) ?? [];
  const includeHowItWorks = howItWorksSteps.length === 3;

  const prompt = `You are an expert Algerian e-commerce conversion designer and copywriter.
Generate a complete single-file HTML sales funnel page optimized for the Algerian mobile market.

═══════════════════════════════════════
OUTPUT RULES — CRITICAL
═══════════════════════════════════════
- Output ONLY raw HTML starting with <!DOCTYPE html>. Zero markdown. Zero explanation. Zero code fences.
- All CSS inside one <style> tag in <head>
- All JS inside one <script> tag before </body>
- No external CDN links. No Google Fonts. No external scripts. No external images except the ones I provide.
- Mobile-first: 390px is the primary target
- Direction: ${isAr ? 'rtl on <html dir="rtl">' : 'ltr on <html dir="ltr">'}
- Language: ALL text in ${isAr ? 'Arabic' : 'French'} only
- Page title: ${product_name}

═══════════════════════════════════════
PRODUCT DATA
═══════════════════════════════════════
Product name: ${product_name}
Description: ${product_description}
Final price: ${product_price} DA${original_price ? `\nOriginal price (cross out): ${original_price} DA` : ''}${discountText ? `\nDiscount badge text: ${discountText}` : ''}
Category: ${product_category}
Key benefits: ${(key_benefits as string[]).join(' | ')}${includeHowItWorks ? `\nHow it works steps: ${howItWorksSteps.join(' → ')}` : ''}
Delivery: ${delivery_days}${delivery_free ? (isAr ? ' — توصيل مجاني' : ' — Livraison gratuite') : ''}${urgency_stock ? `\nStock urgency: ${urgency_stock} units remaining` : ''}

═══════════════════════════════════════
IMAGES — INJECT THESE EXACTLY AS-IS
═══════════════════════════════════════
HERO IMAGE (use this exact HTML verbatim in section 2, do NOT modify it):
${heroImgHtml}

${variant1Html ? `VARIANT 1 (white bg studio shot — use in benefits section, exactly as-is):\n${variant1Html}` : 'VARIANT 1: null — do not add any placeholder'}
${variant2Html ? `VARIANT 2 (lifestyle shot — use in how-it-works section, exactly as-is):\n${variant2Html}` : 'VARIANT 2: null — do not add any placeholder'}
${variant3Html ? `VARIANT 3 (detail shot — use above order form, exactly as-is):\n${variant3Html}` : 'VARIANT 3: null — do not add any placeholder'}

═══════════════════════════════════════
DESIGN SYSTEM — DO NOT DEVIATE
═══════════════════════════════════════
CSS custom properties (declare in :root):
  --primary: ${primary};
  --primary-dark: color-mix(in srgb, ${primary} 85%, black);
  --price-red: #DC2626;
  --price-strike: #9CA3AF;
  --star-gold: #F59E0B;
  --bg-page: #FFFFFF;
  --bg-section-alt: #F9FAFB;
  --bg-trust: #F0FDF4;
  --border-trust: #86EFAC;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --urgency-bg: #FEF2F2;
  --urgency-text: #DC2626;
  --urgency-border: #FECACA;

Global resets (mandatory):
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html { scroll-behavior: smooth }
  body { background: #F3F4F6; font-family: system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 14px; color: #111827; }
  .page-wrap { max-width: 480px; margin: 0 auto; background: #fff; min-height: 100vh; }
  img { max-width: 100%; display: block; }
  input, select, textarea { width: 100%; font-family: inherit; }

Animations:
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .fade-in-section { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
  .fade-in-section.visible { opacity: 1; transform: translateY(0); }

Input / select styles (apply to all form inputs):
  background: #FFFFFF; border: 1.5px solid #D1D5DB; border-radius: 8px; padding: 12px 14px;
  font-size: 15px; color: #111827; margin-bottom: 12px; outline: none; transition: border-color 0.2s;
  On :focus → border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, ${primary} 15%, transparent);

CTA button style (apply to all CTA buttons):
  width: 100%; background: var(--primary); color: white; border: none; border-radius: 10px;
  padding: 16px; font-size: 18px; font-weight: 800; cursor: pointer; font-family: inherit;
  box-shadow: 0 4px 14px color-mix(in srgb, ${primary} 40%, transparent);
  transition: transform 0.1s, box-shadow 0.1s;
  On :hover/:active → transform: scale(0.98); box-shadow reduced;

Horizontal scroll no-scrollbar: scrollbar-width: none; -ms-overflow-style: none; and ::-webkit-scrollbar { display: none; }

═══════════════════════════════════════
PAGE SECTIONS — BUILD ALL IN ORDER
═══════════════════════════════════════

Wrap the entire page content in: <div class="page-wrap">

──────────────────────────────
SECTION 1: STICKY TOP BAR
──────────────────────────────
<div style="position:sticky;top:0;z-index:100;background:var(--primary);height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;">
  ${isAr ? 'Right side' : 'Left side'}: store name "${shortName}" — color:white; font-weight:700; font-size:14px;
  ${isAr ? 'Left side' : 'Right side'}: CTA button that scrolls to #order-section on click
    → text: ${isAr ? '"🛒 اطلب الآن"' : '"🛒 Commander"'}
    → background:white; color:var(--primary); border-radius:20px; padding:6px 14px; font-weight:700; font-size:13px; border:none; cursor:pointer;
</div>

──────────────────────────────
SECTION 2: HERO PRODUCT IMAGE
──────────────────────────────
class="fade-in-section visible" (visible immediately — above fold)
Inject the HERO IMAGE HTML provided above EXACTLY AS-IS.
Below the image (padding:16px 16px 0):
  No extra elements in this section — the pricing block is in section 3.

──────────────────────────────
SECTION 3: RATING + PRICE BLOCK
──────────────────────────────
class="fade-in-section visible" (visible immediately — above fold)
background:#FFFFFF; padding:16px;

Rating pill (inline-block):
  background:#FFFBEB; border:1px solid #FDE68A; border-radius:20px; padding:4px 12px; font-size:12px; color:#92400E;
  Text: "⭐ 4.8/5 · 97% ${isAr ? 'نسبة رضا العملاء' : 'taux de satisfaction'} · +5000 ${isAr ? 'تقييم' : 'avis'}"

Price block (margin-top:12px):
  Final price: font-size:32px; font-weight:900; color:var(--price-red);
  Text: "${product_price} DA"
${original_price ? `  Crossed-out original: font-size:18px; color:var(--price-strike); text-decoration:line-through; Text: "${original_price} DA"
${discountText ? `  Discount badge: background:var(--price-red); color:white; border-radius:4px; padding:2px 8px; font-size:13px; font-weight:700; Text: "${discountText}"` : ''}` : ''}

AI-written emotional headline (margin-top:12px):
  font-size:26px; font-weight:800; color:var(--text-primary); line-height:1.2;
  Write a SHORT punchy headline in ${isAr ? 'Arabic' : 'French'} specific to this product.

AI-written sub-promise (margin-top:6px):
  font-size:14px; color:var(--text-secondary);
  1 sentence promise based on the product description.

──────────────────────────────
SECTION 4: TRUST BAR
──────────────────────────────
class="fade-in-section"
background:var(--bg-trust); border-top:1px solid var(--border-trust); border-bottom:1px solid var(--border-trust); padding:10px 16px;
Container: display:flex; gap:8px; overflow-x:auto; white-space:nowrap; scrollbar-width:none;

4 trust pills (each: font-size:12px; color:#15803D; font-weight:600; white-space:nowrap; flex-shrink:0;):
  ✅ ${isAr ? `توصيل ${delivery_days}` : `Livraison ${delivery_days}`}
  💰 ${isAr ? 'دفع عند الاستلام' : 'Paiement à la livraison'}
  ↩️ ${isAr ? 'ضمان استرداد' : 'Retour garanti'}
  ⭐ +5000 ${isAr ? 'عميل' : 'clients'}

──────────────────────────────
SECTION 5: BENEFITS
──────────────────────────────
class="fade-in-section"
background:#FFFFFF; padding:20px 16px;

Section title: font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:14px;
Text: "${isAr ? `لماذا تختار ${product_name}؟` : `Pourquoi choisir ${product_name} ?`}"

${variant1Html ? 'Inject VARIANT 1 image HTML exactly as-is here, before the benefits list.' : ''}

Benefits list (simple list, NOT cards — do not use grid):
For each of the ${(key_benefits as string[]).length} key benefits below, create a row:
  Row: display:flex; align-items:flex-start; gap:10px; margin-bottom:12px;
  Left: "✅" — font-size:16px; (plain text emoji, no colored circle/box)
  Right:
    Title: font-size:15px; font-weight:700; color:var(--text-primary);
    Detail: font-size:13px; color:var(--text-secondary); margin-top:2px;
    AI expands each benefit into a title + 1 detail line.

Benefits to expand: ${(key_benefits as string[]).map((b, i) => `${i + 1}. ${b}`).join(' | ')}

──────────────────────────────
${includeHowItWorks ? `SECTION 6: HOW IT WORKS
──────────────────────────────
class="fade-in-section"
background:var(--bg-section-alt); padding:20px 16px;

Section title: font-size:18px; font-weight:800; margin-bottom:16px;
Text: "${isAr ? 'كيف يعمل؟' : 'Comment ça marche ?'}"

${variant2Html ? 'Inject VARIANT 2 image HTML exactly as-is here, before the steps.' : ''}

3 steps (vertical list):
Each step: display:flex; gap:14px; align-items:flex-start; margin-bottom:16px;
Left circle: width:36px; height:36px; border-radius:50%; background:var(--primary); color:white; font-size:16px; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0;
Right: font-size:14px; color:var(--text-primary); font-weight:600; line-height:1.5;

Steps:
1. ${howItWorksSteps[0]}
2. ${howItWorksSteps[1]}
3. ${howItWorksSteps[2]}` : 'SECTION 6: HOW IT WORKS — OMIT entirely (no data provided)'}
──────────────────────────────
SECTION 7: URGENCY BANNER
──────────────────────────────
class="fade-in-section"
background:var(--urgency-bg); border-top:1px solid var(--urgency-border); border-bottom:1px solid var(--urgency-border); padding:14px 16px; text-align:center;

${urgency_stock ? `Line 1 (stock): "⚠️ ${isAr ? `تبقى فقط` : `Plus que`} <span style="animation:pulse 1.5s infinite;display:inline-block;">${urgency_stock}</span> ${isAr ? 'قطعة فقط!' : 'unités restantes!'}"
  font-size:16px; font-weight:800; color:var(--urgency-text);` : ''}
Line ${urgency_stock ? '2' : '1'} (delivery): "🚚 ${isAr ? `التوصيل خلال ${delivery_days} لجميع الولايات` : `Livraison en ${delivery_days} pour toutes les wilayas`}"
  font-size:13px; color:var(--urgency-text); margin-top:4px;

──────────────────────────────
SECTION 8: TESTIMONIALS
──────────────────────────────
class="fade-in-section"
background:#FFFFFF; padding:20px 16px;

Section title: font-size:18px; font-weight:800; margin-bottom:16px; color:var(--text-primary);
Text: "${isAr ? 'ماذا قال عملاؤنا' : 'Avis de nos clients'}"

Horizontal scroll container:
  display:flex; overflow-x:auto; gap:12px; padding-bottom:8px; scrollbar-width:none;

4 testimonial cards (each: min-width:240px; max-width:260px; flex-shrink:0; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px; padding:14px;):
  Row 1: flex row; align-items:center; gap:8px;
    Avatar circle (32px, border-radius:50%, background:color-mix(in srgb,${primary} 15%,white), color:${primary}, font-weight:700, font-size:13px, display:flex, align-items:center, justify-content:center) showing first 2 letters of name
    Name: font-size:13px; font-weight:700;
    City: font-size:11px; color:var(--text-secondary); ${isAr ? 'margin-right:auto;' : 'margin-left:auto;'}
  Row 2: Stars "⭐⭐⭐⭐⭐" or "⭐⭐⭐⭐" — font-size:12px; margin:6px 0;
  Row 3: Comment — font-size:13px; color:var(--text-primary); line-height:1.5;

Generate 4 realistic testimonials:
  - Use real Algerian names (mix male/female)
  - Cities: Alger, Oran, Constantine, Annaba, Blida, Tizi Ouzou, Béjaïa, Sétif, Batna, Tlemcen
  - Write comments in ${isAr ? 'DARIJA (Algerian dialect) — real everyday expressions like: "واه والله كنت خايف نشري... بصح جاء مليح بزاف! التوصيل كان سريع"' : 'French — conversational, specific to the product'}
  - Comments must feel authentic and specific to "${product_name}"
  - Ratings: 3 cards with 5 stars, 1 card with 4 stars

──────────────────────────────
SECTION 9: ORDER FORM
──────────────────────────────
<div id="order-section" style="background:var(--bg-section-alt);padding:20px 16px;border-top:3px solid var(--primary);">
class="fade-in-section"

${variant3Html ? 'Inject VARIANT 3 image HTML exactly as-is here, at the top of this section.' : ''}

Product summary block:
  Product name: font-size:16px; font-weight:700; margin-bottom:4px;
  Final price: font-size:28px; font-weight:900; color:var(--price-red);
${original_price ? `  Crossed-out + badge: same as section 3` : ''}

Form title: "📦 ${isAr ? 'أكمل طلبك الآن' : 'Complétez votre commande'}"
font-size:16px; font-weight:800; margin:14px 0 12px;

FORM — EXACTLY 3 FIELDS, NO MORE:

<form id="order-form-el">

Field 1 — Full name:
  <label>${isAr ? 'الاسم الكامل' : 'Nom complet'} *</label>
  <input type="text" id="f-name" placeholder="${isAr ? 'مثال: محمد أمين' : 'Ex: Mohamed Amine'}" required>
  <div id="err-name" style="color:#DC2626;font-size:12px;display:none;margin-top:-8px;margin-bottom:8px;"></div>

Field 2 — Phone:
  <label>${isAr ? 'رقم الهاتف' : 'Numéro de téléphone'} *</label>
  <input type="tel" id="f-phone" placeholder="05XXXXXXXX" required>
  <div id="err-phone" style="color:#DC2626;font-size:12px;display:none;margin-top:-8px;margin-bottom:8px;"></div>

Field 3 — Wilaya:
  <label>${isAr ? 'الولاية' : 'Wilaya'} *</label>
  <select id="f-wilaya" required>
    <option value="">${isAr ? 'اختر الولاية' : 'Choisissez la wilaya'}</option>
${wilayaOptionsHtml}
  </select>
  <div id="err-wilaya" style="color:#DC2626;font-size:12px;display:none;margin-top:-8px;margin-bottom:8px;"></div>

</form>

Success block (hidden by default):
<div id="success-block" style="display:none;text-align:center;padding:40px 20px;">
  <div style="font-size:64px;text-align:center;margin-bottom:16px;">✅</div>
  <p style="font-size:22px;font-weight:800;color:#15803D;">${isAr ? '🎉 تم استلام طلبك!' : '🎉 Commande reçue !'}</p>
  <p style="font-size:14px;color:var(--text-secondary);margin-top:8px;">${isAr ? 'سيتم التواصل معك قريباً لتأكيد الطلب وإتمام عملية التوصيل' : 'Notre équipe vous contactera bientôt pour confirmer votre commande et organiser la livraison'}</p>
  <p style="font-size:14px;font-weight:700;color:var(--primary);margin-top:12px;">${isAr ? `التوصيل خلال ${delivery_days} 🚚` : `Livraison en ${delivery_days} 🚚`}</p>
</div>

CTA button (below the form, outside the form element):
<button id="submit-btn" type="button" onclick="submitOrder()" style="[full CTA button style as specified in design system];margin-top:8px;">
  ${isAr ? 'اطلب الآن 🛒' : 'Commander maintenant 🛒'}
</button>

Trust micro-copy below button:
text-align:center; font-size:12px; color:var(--text-secondary); margin-top:10px;
"✅ ${isAr ? 'دفع عند الاستلام' : 'Paiement à la livraison'} &nbsp;|&nbsp; 🚚 ${isAr ? `توصيل ${delivery_days}` : `Livraison ${delivery_days}`} &nbsp;|&nbsp; ↩️ ${isAr ? 'ضمان استرداد' : 'Retour garanti'}"

</div>

──────────────────────────────
SECTION 10: FOOTER
──────────────────────────────
background:#111827; color:#9CA3AF; padding:20px 16px; text-align:center; font-size:12px;

Line 1: "${workspaceName}" — color:white; font-weight:700; margin-bottom:6px;
Line 2: "${isAr ? `جميع الحقوق محفوظة © ${currentYear}` : `Tous droits réservés © ${currentYear}`}"

═══════════════════════════════════════
JAVASCRIPT — PLACE IN <script> BEFORE </body>
═══════════════════════════════════════

const PAGE_SLUG = "${slug}";
const PRODUCT_PRICE = ${product_price};
const PRODUCT_NAME = "${(product_name as string).replace(/"/g, '\\"')}";

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}

function submitOrder() {
  const name = (document.getElementById('f-name').value || '').trim();
  const phone = (document.getElementById('f-phone').value || '').trim();
  const wilaya = document.getElementById('f-wilaya').value;
  const btn = document.getElementById('submit-btn');

  // Clear errors
  showErr('err-name', '');
  showErr('err-phone', '');
  showErr('err-wilaya', '');

  let valid = true;
  if (name.length < 2) { showErr('err-name', '${isAr ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Le nom doit contenir au moins 2 caractères'}'); valid = false; }
  if (!/^(05|06|07)[0-9]{8}$/.test(phone)) { showErr('err-phone', '${isAr ? 'أدخل رقم هاتف جزائري صحيح (05/06/07XXXXXXXX)' : 'Numéro algérien invalide (commencer par 05/06/07)'}'); valid = false; }
  if (!wilaya) { showErr('err-wilaya', '${isAr ? 'يرجى اختيار الولاية' : 'Veuillez choisir une wilaya'}'); valid = false; }
  if (!valid) return;

  btn.disabled = true;
  btn.textContent = '${isAr ? '⏳ جاري الإرسال...' : '⏳ Envoi en cours...'}';

  fetch('/api/landing-pages/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: name,
      customer_phone: phone,
      wilaya: wilaya,
      commune: '',
      product_name: PRODUCT_NAME,
      unit_price: PRODUCT_PRICE,
      quantity: 1,
      page_slug: PAGE_SLUG,
      notes: ''
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      document.getElementById('order-form-el').style.display = 'none';
      btn.style.display = 'none';
      document.getElementById('success-block').style.display = 'block';
    } else {
      btn.disabled = false;
      btn.textContent = '${isAr ? 'اطلب الآن 🛒' : 'Commander maintenant 🛒'}';
      showErr('err-wilaya', '${isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Une erreur s\'est produite, réessayez'}');
    }
  })
  .catch(function() {
    btn.disabled = false;
    btn.textContent = '${isAr ? 'اطلب الآن 🛒' : 'Commander maintenant 🛒'}';
  });
}

// Sticky topbar CTA → scroll to order section
document.querySelectorAll('[data-scroll-order]').forEach(function(el) {
  el.addEventListener('click', function() {
    var target = document.getElementById('order-section');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
// Also hook the inline onclick topbar button if it uses scrollToOrder
function scrollToOrder() {
  var target = document.getElementById('order-section');
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

// IntersectionObserver fade-in
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in-section').forEach(function(el) { obs.observe(el); });
// First 2 sections are above fold — show immediately
document.querySelectorAll('.fade-in-section').forEach(function(el, i) {
  if (i < 2) el.classList.add('visible');
});`;

  type Part = { text: string } | { inlineData: { data: string; mimeType: string } };
  const contentParts: Part[] = [];
  if (image_base64 && image_mime_type) {
    contentParts.push({ inlineData: { data: image_base64 as string, mimeType: image_mime_type as string } });
  }
  contentParts.push({ text: prompt });

  let html_content: string;
  try {
    html_content = (await generateContentWithFallback(contentParts, { maxOutputTokens: 65536, temperature: 0.7 }))
      .replace(/^```html\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${msg}` }, { status: 500 });
  }

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
        fal_variant_urls: variantImages,
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
