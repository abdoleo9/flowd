import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = getSupabaseServiceClient();

  const { data: page } = await supabase
    .from('landing_pages')
    .select('id, html_content, status')
    .eq('slug', params.slug)
    .single();

  if (!page || page.status !== 'active') {
    return new Response('Page not found', { status: 404 });
  }

  // Fire-and-forget view increment
  supabase.rpc('increment_landing_page_views', { page_id: page.id }).then(() => {});

  return new Response(page.html_content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
