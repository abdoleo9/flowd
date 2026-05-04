import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveWorkspaceId } from '@/lib/active-workspace';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const body = await req.json();
  const {
    html_content,
    slug,
    image_url,
    product_name,
    product_description,
    product_price,
    generation_config,
  } = body;

  if (!html_content || !slug || !product_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: page, error } = await supabase
    .from('landing_pages')
    .insert({
      workspace_id: workspaceId,
      slug,
      product_name,
      product_description: product_description || '',
      product_price: parseFloat(product_price) || 0,
      product_images: image_url ? [image_url] : [],
      html_content,
      status: 'active',
      generation_config: generation_config || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé. Choisissez une autre URL personnalisée.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page, slug });
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Validate workspace membership via active workspace cookie
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  // Also accept workspace_id param but verify it matches the active one
  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get('workspace_id') ?? workspaceId;
  if (requestedId !== workspaceId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
