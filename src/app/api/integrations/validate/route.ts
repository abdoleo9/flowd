import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, error: "Token manquant" }, { status: 400 });

  try {
    // Instagram User Access Tokens (from User Token Generator) → Instagram Graph API
    const igRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name&access_token=${encodeURIComponent(token)}`
    );
    const igData = await igRes.json();

    if (!igData.error) {
      return NextResponse.json({
        valid: true,
        name: igData.username ?? igData.name ?? igData.id,
        id: igData.id,
      });
    }

    // Fallback: Facebook Page Access Token → Facebook Graph API
    const fbRes = await fetch(
      `https://graph.facebook.com/me?fields=name,id&access_token=${encodeURIComponent(token)}`
    );
    const fbData = await fbRes.json();

    if (!fbData.error) {
      return NextResponse.json({ valid: true, name: fbData.name, id: fbData.id });
    }

    // Both failed — return the Instagram error message
    return NextResponse.json({ valid: false, error: igData.error?.message ?? fbData.error?.message });
  } catch {
    return NextResponse.json({ valid: false, error: "Impossible de contacter Meta" }, { status: 500 });
  }
}
