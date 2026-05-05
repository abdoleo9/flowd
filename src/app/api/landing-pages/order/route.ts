import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

// Ordered 1-58 to map wilaya name → integer code for the orders table
const WILAYA_NAMES = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem',"M'Sila",'Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane','El M\'Ghair','El Menia','Ouled Djellal','Bordj Baji Mokhtar',
  'Béni Abbès','Timimoun','Touggourt','Djanet','In Salah','In Guezzam',
];

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  const { customer_name, customer_phone, wilaya, commune, quantity, notes, page_slug } = body;

  if (
    !customer_name?.trim() ||
    !customer_phone?.trim() ||
    !wilaya?.trim() ||
    !page_slug?.trim()
  ) {
    return NextResponse.json({ success: false, error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const { data: page, error: pageError } = await supabase
    .from('landing_pages')
    .select('id, workspace_id, product_name, product_price')
    .eq('slug', page_slug)
    .eq('status', 'active')
    .single();

  if (pageError || !page) {
    return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
  }

  const qty = Math.max(1, parseInt(quantity) || 1);
  const total_price = page.product_price * qty;
  const reference = `ORD-LP-${Date.now().toString().slice(-8)}`;

  // Map wilaya to 1-58 integer code: accept numeric code (new funnel form) or name (legacy)
  const parsedCode = parseInt(wilaya as string, 10);
  const wilaya_code = (parsedCode >= 1 && parsedCode <= 58)
    ? parsedCode
    : Math.max(1, WILAYA_NAMES.indexOf(wilaya as string) + 1);

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      workspace_id: page.workspace_id,
      reference,
      customer_name,
      customer_phone,
      wilaya_code,
      commune,
      address: commune,
      product_name: page.product_name,
      quantity: qty,
      unit_price: page.product_price,
      total_price,
      status: 'pending',
      source: 'manual',
      notes: `Via landing page: ${page_slug}. ${notes || ''}`.trim(),
    });

  if (orderError) {
    return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
  }

  await supabase.rpc('increment_landing_page_orders', { page_id: page.id });

  return NextResponse.json({ success: true, reference });
}
