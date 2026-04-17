import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  const { customer_name, customer_phone, wilaya, commune, quantity, notes, page_slug } = body;

  const { data: page, error: pageError } = await supabase
    .from('landing_pages')
    .select('id, workspace_id, product_name, product_price')
    .eq('slug', page_slug)
    .eq('status', 'active')
    .single();

  if (pageError || !page) {
    return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
  }

  const total_price = page.product_price * (quantity || 1);
  const reference = `ORD-LP-${Date.now().toString().slice(-8)}`;

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      workspace_id: page.workspace_id,
      reference,
      customer_name,
      customer_phone,
      wilaya_code: wilaya,
      commune,
      address: commune,
      product_name: page.product_name,
      quantity: quantity || 1,
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
