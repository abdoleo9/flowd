import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function popupHTML(type: 'success' | 'error', channel?: string, error?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const message = type === 'success'
    ? `{ type: 'META_OAUTH_SUCCESS', channel: '${channel}' }`
    : `{ type: 'META_OAUTH_ERROR', error: '${error}' }`
  return `<!DOCTYPE html><html><body><script>
    window.opener?.postMessage(${message}, '${appUrl}');
    window.close();
  <\/script></body></html>`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const oauthError = searchParams.get('error')

  if (oauthError || !code || !stateRaw) {
    return new NextResponse(popupHTML('error', undefined, 'cancelled'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  let workspaceId: string, channel: string
  try {
    ;({ workspaceId, channel } = JSON.parse(Buffer.from(stateRaw, 'base64url').toString()))
  } catch {
    return new NextResponse(popupHTML('error', undefined, 'invalid_state'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!

  // 1. Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return new NextResponse(popupHTML('error', undefined, 'token_failed'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // 2. Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  )
  const { access_token: longToken } = await longRes.json()

  // 3. Get connected pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`
  )
  const pagesData = await pagesRes.json()
  const page = pagesData.data?.[0]

  // 4. Subscribe page to webhook
  if (page?.id && page?.access_token) {
    await fetch(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`, {
      method: 'POST',
      body: new URLSearchParams({
        subscribed_fields: 'messages,messaging_postbacks',
        access_token: page.access_token,
      }),
    }).catch(() => {})
  }

  // 5. Save to Supabase
  const supabase = await createClient()
  await supabase.from('integrations').upsert({
    workspace_id: workspaceId,
    type: channel,
    label: page?.name ?? channel,
    is_active: true,
    credentials: {
      access_token: page?.access_token ?? longToken,
      page_id: page?.id,
      user_token: longToken,
    },
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,type' })

  return new NextResponse(popupHTML('success', channel), {
    headers: { 'Content-Type': 'text/html' },
  })
}
