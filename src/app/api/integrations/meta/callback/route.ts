import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function popupHTML(script: string) {
  return `<!DOCTYPE html><html><body><script>
    (function() {
      ${script}
      window.close();
    })();
  <\/script><noscript>You can close this window.</noscript></body></html>`
}

function errorPopup(error: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  return popupHTML(`window.opener?.postMessage({ type: 'META_OAUTH_ERROR', error: '${error}' }, '${appUrl}');`)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const oauthError = searchParams.get('error')

  const htmlHeaders = { 'Content-Type': 'text/html' }

  if (oauthError || !code || !stateRaw) {
    return new NextResponse(errorPopup('cancelled'), { headers: htmlHeaders })
  }

  let workspaceId: string, channel: string
  try {
    ;({ workspaceId, channel } = JSON.parse(Buffer.from(stateRaw, 'base64url').toString()))
  } catch {
    return new NextResponse(errorPopup('invalid_state'), { headers: htmlHeaders })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // 1. Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return new NextResponse(errorPopup('token_failed'), { headers: htmlHeaders })
  }

  // 2. Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  )
  const { access_token: longToken } = await longRes.json()
  const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days

  // 3. Get connected pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,access_token&access_token=${longToken}`
  )
  const pagesData = await pagesRes.json()
  const pages: { id: string; name: string; category?: string; access_token: string }[] = pagesData.data ?? []

  if (pages.length === 0) {
    return new NextResponse(errorPopup('no_pages_found'), { headers: htmlHeaders })
  }

  // 4. If user has multiple pages, send them back to the opener for page picking
  if (pages.length > 1) {
    const safePages = pages.map(({ id, name, category }) => ({ id, name, category }))
    const script = `
      window.opener?.postMessage({
        type: 'META_PAGE_PICKER',
        channel: '${channel}',
        pages: ${JSON.stringify(safePages)},
        token: ${JSON.stringify(longToken)},
        workspaceId: '${workspaceId}',
        tokenExpiresAt: '${tokenExpiresAt}'
      }, '${appUrl}');
    `
    return new NextResponse(popupHTML(script), { headers: htmlHeaders })
  }

  // 5. Single page — connect automatically
  const page = pages[0]

  // Subscribe page to webhook
  if (page.id && page.access_token) {
    await fetch(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`, {
      method: 'POST',
      body: new URLSearchParams({
        subscribed_fields: 'messages,messaging_postbacks',
        access_token: page.access_token,
      }),
    }).catch(() => {})
  }

  // 6. Save to Supabase
  const supabase = getSupabaseAdmin()
  await supabase.from('integrations').upsert({
    workspace_id: workspaceId,
    type: channel,
    label: page.name,
    is_active: true,
    credentials: {
      access_token: page.access_token ?? longToken,
      page_id: page.id,
      user_token: longToken,
    },
    token_expires_at: tokenExpiresAt,
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,type' })

  const successScript = `window.opener?.postMessage({ type: 'META_OAUTH_SUCCESS', channel: '${channel}' }, '${appUrl}');`
  return new NextResponse(popupHTML(successScript), { headers: htmlHeaders })
}
