import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase/server';
import { getGenAI } from '@/lib/claude';

const WILAYAS = `Adrar,Chlef,Laghouat,Oum El Bouaghi,Batna,Béjaïa,Biskra,Béchar,Blida,Bouira,Tamanrasset,Tébessa,Tlemcen,Tiaret,Tizi Ouzou,Alger,Djelfa,Jijel,Sétif,Saïda,Skikda,Sidi Bel Abbès,Annaba,Guelma,Constantine,Médéa,Mostaganem,M'Sila,Mascara,Ouargla,Oran,El Bayadh,Illizi,Bordj Bou Arréridj,Boumerdès,El Tarf,Tindouf,Tissemsilt,El Oued,Khenchela,Souk Ahras,Tipaza,Mila,Aïn Defla,Naâma,Aïn Témouchent,Ghardaïa,Relizane,El M'Ghair,El Menia,Ouled Djellal,Bordj Baji Mokhtar,Béni Abbès,Timimoun,Touggourt,Djanet,In Salah,In Guezzam`;

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
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
    custom_slug,
  } = body;

  // Resolve final slug
  const autoBase = (product_name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug =
    custom_slug && /^[a-z0-9][a-z0-9-]*$/.test(custom_slug as string)
      ? (custom_slug as string)
      : `${autoBase}-${Date.now()}`;

  const isAr = language === 'ar';
  const primary = (color_theme as string) || '#111827';

  // Upload image to Supabase Storage for CDN delivery
  let image_url: string | null = null;
  if (imageBase64 && mimeType) {
    try {
      const svc = getSupabaseServiceClient();
      const ext = (mimeType as string).split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
      const fileName = `${slug}-${Date.now()}.${ext}`;
      const buffer = Buffer.from(imageBase64 as string, 'base64');
      const { error: uploadError } = await svc.storage
        .from('landing-page-images')
        .upload(fileName, buffer, { contentType: mimeType as string, upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = svc.storage
          .from('landing-page-images')
          .getPublicUrl(fileName);
        image_url = publicUrl;
      }
    } catch {
      // Fall back to base64 in HTML if Storage upload fails
    }
  }

  // Build the product image tag — prefer CDN URL, fall back to base64, then placeholder
  const imgStyle = `width:100%;max-width:500px;border-radius:20px;object-fit:cover;box-shadow:0 20px 60px rgba(0,0,0,0.15)`;
  const imgTag = image_url
    ? `<img src="${image_url}" alt="${product_name}" style="${imgStyle}">`
    : imageBase64 && mimeType
    ? `<img src="data:${mimeType};base64,${imageBase64}" alt="${product_name}" style="${imgStyle}">`
    : `<div style="width:100%;max-width:500px;aspect-ratio:1;background:linear-gradient(135deg,var(--pl) 0%,var(--pm) 100%);border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:5rem;color:var(--p)">${(product_name as string).charAt(0).toUpperCase()}</div>`;

  const js = `<script>
window.PAGE_SLUG='${slug}';
window.submitFlowdOrder=async function(){
  const f=document.getElementById('order-form');
  const b=document.getElementById('submit-btn');
  const d={customer_name:f.customer_name.value.trim(),customer_phone:f.customer_phone.value.trim(),wilaya:f.wilaya.value,commune:f.commune.value.trim(),quantity:parseInt(f.quantity.value)||1,notes:f.notes?f.notes.value.trim():''};
  if(!d.customer_name||!d.customer_phone||!d.wilaya||!d.commune){alert('${isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs obligatoires'}');return;}
  b.disabled=true;b.textContent='${isAr ? 'جارٍ الإرسال...' : 'Envoi en cours...'}';
  try{
    const r=await fetch('/api/landing-pages/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,page_slug:window.PAGE_SLUG})});
    const res=await r.json();
    if(res.success){document.getElementById('order-form').innerHTML='<div style="text-align:center;padding:60px 20px"><div style="font-size:3rem">✅</div><p style="font-size:1.2rem;font-weight:700;margin-top:16px">${isAr ? 'تم استلام طلبك! سنتواصل معك قريباً' : 'Commande reçue ! Nous vous contacterons bientôt.'}</p></div>';}
    else{b.disabled=false;b.textContent='${isAr ? 'تأكيد الطلب' : 'Confirmer la commande'}';alert('${isAr ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'Une erreur est survenue, veuillez réessayer'}');}
  }catch(e){b.disabled=false;b.textContent='${isAr ? 'تأكيد الطلب' : 'Confirmer la commande'}';}
};
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.1});
document.querySelectorAll('.fi').forEach(el=>obs.observe(el));
</script>`;

  const wilayaOptions = WILAYAS.split(',').map(w => `<option value="${w.trim()}">${w.trim()}</option>`).join('');

  const prompt = `You are a world-class web designer. Build a premium, conversion-optimized product landing page.

OUTPUT RULES (critical):
- Output ONLY a <style> tag followed by HTML elements — NO <!DOCTYPE>, NO <html>, NO <head>, NO <body> tags
- All CSS in the single <style> tag at the very top
- No external resources. No markdown. No explanation.

PRODUCT:
- Name: ${product_name}
- Description: ${product_description}
- Price: ${product_price} DA
- Category: ${product_category}
- Audience: ${target_audience}
- Benefits: ${key_benefits}
- Primary color: ${primary}
- Language: ${isAr ? 'Arabic (RTL, dir=rtl)' : 'French'}

DESIGN (mandatory):
- :root { --p:${primary}; --pl:${primary}18; --pm:${primary}33; --bg:#fff; --gs:#f9fafb; --bd:#e5e7eb; --tx:#111; --mt:#6b7280; }
- Font: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif
- Generous whitespace. Container max-width:1200px margin:0 auto padding:0 24px
- Cards: background:white; border:1px solid var(--bd); border-radius:14px; box-shadow:0 4px 20px rgba(0,0,0,0.06)
- Buttons: border-radius:50px; padding:14px 32px; font-weight:700; cursor:pointer; border:none; transition:transform 0.2s,opacity 0.2s
- Fade-in: .fi{opacity:0;transform:translateY(24px);transition:opacity 0.6s,transform 0.6s} .fi.visible{opacity:1;transform:none}
- Mobile: @media(max-width:768px) all grids become single column

BUILD THESE 9 SECTIONS IN ORDER:

1. NAVBAR — sticky, top:0, z-index:100, white bg, backdrop-filter:blur(12px), border-bottom:1px solid var(--bd), height:64px, flex, space-between, align-center, padding:0 24px
   Left: bold brand name (${(product_name as string).split(' ')[0]})
   Center: 4 links (${isAr ? 'الرئيسية · عن المنتج · التقييمات · تواصل معنا' : 'Accueil · À propos · Avis · Contact'}) — font-size:0.9rem, color:var(--mt), no underline, gap:32px
   Right: filled pill button (${isAr ? 'اطلب الآن' : 'Commander'}) background:var(--p), color:white

2. HERO — min-height:90vh, display:grid, grid-template-columns:1fr 1fr, gap:60px, align-items:center, padding:80px 24px
   LEFT col:
     - Category pill: background:var(--pl), color:var(--p), border-radius:50px, padding:6px 16px, font-size:0.8rem, font-weight:600, display:inline-block, margin-bottom:20px
     - H1: clamp(2.8rem,5vw,4.2rem), font-weight:900, line-height:1.1, letter-spacing:-0.02em — write a punchy 2-line headline
     - Subheadline: 1rem, color:var(--mt), line-height:1.7, margin:20px 0
     - Price: font-size:2.2rem, font-weight:800, color:var(--p) — "${product_price} DA"
     - Two buttons: primary (background:var(--p), color:white, onclick scroll to #order-section) + outline (border:2px solid var(--p), color:var(--p), background:transparent, onclick scroll to #about), side by side with gap:16px, flex-wrap:wrap
     - Trust row: flex, gap:20px, margin-top:20px, font-size:0.85rem, color:var(--mt) — "🚚 ${isAr ? 'توصيل مجاني' : 'Livraison gratuite'} · ✅ ${isAr ? 'أصلي 100%' : 'Authentique'} · 🛡️ ${isAr ? 'ضمان 30 يوم' : 'Garantie 30j'}"
   RIGHT col: wrap the image in a div with background:var(--pl), border-radius:24px, padding:32px, display:flex, align-items:center, justify-content:center
   EMBED THIS EXACT IMAGE TAG: ${imgTag}

3. STATS BAR — full width, background:var(--gs), border-top/bottom:1px solid var(--bd), padding:32px 24px
   4 stats in flex row, justify-content:center, gap:60px, wrap:wrap
   Each: number in bold (1.8rem, var(--p)) + label below (0.85rem, var(--mt))
   Make realistic numbers: customers 1000+, rating ★4.8, delivery 48h, quality 100%
   Use ${isAr ? 'Arabic' : 'French'} labels

4. BENEFITS — id="benefits", padding:80px 0, text-align:center
   Small uppercase label (var(--p), letter-spacing:0.1em, font-size:0.8rem)
   H2: "${isAr ? 'مميزاتنا' : 'Nos avantages'}"
   Grid of 3 cards (grid-template-columns:repeat(3,1fr), gap:24px, margin-top:48px) — add class="fi" to each card
   Each card: padding:36px 28px, hover{transform:translateY(-4px)}
     Emoji in 64px circle (background:var(--pl), border-radius:50%, margin:0 auto 20px)
     Bold title, muted description
   Generate 3 benefits from "${key_benefits}"

5. ABOUT — id="about", padding:80px 0, background:var(--gs)
   2-col grid (1fr 1fr, gap:60px, align-items:center) — each col gets class="fi"
   LEFT: ${imgTag}
   RIGHT: small label, H2 "${isAr ? 'عن المنتج' : 'À propos du produit'}", paragraph, then 4-5 features as flex rows (24px green circle with ✓ + text)
   CTA button

6. HOW IT WORKS — padding:80px 0, text-align:center
   H2, then 3 steps in flex row (justify-content:center, gap:40px, flex-wrap:wrap)
   Each step: class="fi", 52px circle badge (background:var(--p), color:white, font-size:1.4rem, font-weight:800), step title, step description
   Steps: 1 ${isAr ? 'اختر المنتج' : 'Choisissez'} / 2 ${isAr ? 'أدخل بياناتك' : 'Remplissez'} / 3 ${isAr ? 'استلم طلبك' : 'Recevez'}

7. TESTIMONIALS — id="reviews", padding:80px 0, background:var(--gs)
   H2, then 3 cards (grid-template-columns:repeat(3,1fr), gap:24px) — class="fi" on each
   Each card: padding:28px
     ★★★★★ in var(--p), font-size:1.1rem
     Italic review text (2-3 sentences in ${isAr ? 'Arabic' : 'French'}, mention a specific product benefit)
     Customer row: flex, gap:12px — 44px avatar circle (background:var(--pl), color:var(--p), font-weight:700, show 2-letter initials) + name (bold) + city (muted)
   Use Algerian names (Amira K., Mohamed B., Sara L., Karim M., Nadia H.) and cities (Alger, Oran, Constantine, Annaba, Tizi Ouzou)

8. ORDER FORM — id="order-section", padding:80px 0, background:linear-gradient(135deg,var(--pl),white)
   H2 centered
   2-col grid (1fr 1.2fr, gap:40px, align-items:start, margin-top:48px)
   LEFT card (padding:32px):
     Product name bold, price in var(--p) (2rem), 3 bullet benefits
     Trust badges: 🔒 ${isAr ? 'دفع عند الاستلام' : 'Paiement à la livraison'}, 🚚 ${isAr ? 'توصيل مجاني' : 'Livraison gratuite'}, ✅ ${isAr ? 'ضمان' : 'Garantie'}
   RIGHT card (padding:36px) — this is the actual form:
     <form id="order-form">
     Field style: width:100%;padding:14px 16px;border:1.5px solid var(--bd);border-radius:8px;font-size:0.95rem;margin-top:6px;box-sizing:border-box;outline:none — add focus style via CSS
     Label style: font-weight:600;font-size:0.85rem;color:var(--tx);display:block
     1. customer_name (text, required) — "${isAr ? 'الاسم الكامل' : 'Nom complet'}"
     2. customer_phone (tel, required) — "${isAr ? 'رقم الهاتف' : 'Téléphone'}"
     3. wilaya (select, required) — "${isAr ? 'الولاية' : 'Wilaya'}" — first option: disabled selected value="" "${isAr ? 'اختر الولاية' : 'Choisir la wilaya'}" — then: ${wilayaOptions}
     4. commune (text, required) — "${isAr ? 'البلدية / العنوان' : 'Commune / Adresse'}"
     5. quantity (number, min=1, value=1) — "${isAr ? 'الكمية' : 'Quantité'}"
     6. notes (textarea, rows=3) — "${isAr ? 'ملاحظات' : 'Remarques'}"
     </form>
     <button id="submit-btn" onclick="window.submitFlowdOrder()" style="width:100%;background:var(--p);color:white;padding:18px;border:none;border-radius:8px;font-size:1.05rem;font-weight:700;cursor:pointer;margin-top:8px">${isAr ? 'تأكيد الطلب' : 'Confirmer la commande'}</button>

9. FOOTER — background:#111, color:#999, padding:48px 24px
   3-col grid: LEFT (brand name in white bold + tagline) · CENTER (4 quick links in white) · RIGHT (contact info)
   Bottom bar: border-top:1px solid #333, margin-top:32px, padding-top:20px, text-align:center, font-size:0.85rem, color:#555 — "Powered by Flowd"

END WITH:
${js}`;

  const model = getGenAI().getGenerativeModel(
    { model: 'gemini-2.5-flash' },
    { apiVersion: 'v1beta' }
  );

  let html_content: string;
  try {
    type Part = { text: string } | { inlineData: { data: string; mimeType: string } };
    const contentParts: Part[] = [];
    // Always send image to Gemini for multimodal generation even if we also uploaded to Storage
    if (imageBase64 && mimeType) {
      contentParts.push({ inlineData: { data: imageBase64 as string, mimeType: mimeType as string } });
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

  // Return generated HTML — caller is responsible for publishing via POST /api/landing-pages
  return NextResponse.json({ html_content, slug, image_url });
}
