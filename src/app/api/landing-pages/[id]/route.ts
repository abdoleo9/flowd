import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveWorkspaceId } from '@/lib/active-workspace';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const body = await req.json();
  const { status, html_content, generation_config, image_url, product_name, product_description, product_price } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (status !== undefined) {
    if (!['active', 'paused', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.status = status;
  }
  if (html_content !== undefined) updates.html_content = html_content;
  if (generation_config !== undefined) updates.generation_config = generation_config;
  if (image_url !== undefined) {
    updates.image_url = image_url;
    updates.product_images = image_url ? [image_url] : [];
  }
  if (product_name !== undefined) updates.product_name = product_name;
  if (product_description !== undefined) updates.product_description = product_description;
  if (product_price !== undefined) updates.product_price = parseFloat(product_price) || 0;

  const { data, error } = await supabase
    .from('landing_pages')
    .update(updates)
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data });
}
