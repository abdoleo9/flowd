import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel') as 'instagram' | 'messenger' | 'whatsapp'

  if (!channel || !['instagram', 'messenger', 'whatsapp'].includes(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get active workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  const workspaceId = workspace?.id ?? user.id
  const state = Buffer.from(JSON.stringify({ workspaceId, channel, userId: user.id })).toString('base64url')

  const scopes: Record<string, string> = {
    instagram: 'instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata',
    messenger: 'pages_show_list,pages_manage_metadata,pages_messaging',
    whatsapp: 'whatsapp_business_management,whatsapp_business_messaging',
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', process.env.META_APP_ID!)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scopes[channel])
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
