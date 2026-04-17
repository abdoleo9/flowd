import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function LandingPageRoute({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = getSupabaseServiceClient();

  const { data: page } = await supabase
    .from('landing_pages')
    .select('id, html_content, product_name, status')
    .eq('slug', params.slug)
    .single();

  if (!page || page.status !== 'active') notFound();

  // Increment views — fire and forget
  supabase
    .rpc('increment_landing_page_views', { page_id: page.id })
    .then(() => {});

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{page.product_name}</title>
      </head>
      <body dangerouslySetInnerHTML={{ __html: page.html_content }} />
    </html>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = getSupabaseServiceClient();

  const { data: page } = await supabase
    .from('landing_pages')
    .select('product_name, product_description')
    .eq('slug', params.slug)
    .single();

  return {
    title: page?.product_name || 'Flowd',
    description: page?.product_description || '',
  };
}
