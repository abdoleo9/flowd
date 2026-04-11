import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, error: "Token manquant" }, { status: 400 });

  try {
    const res = await fetch(
      `https://graph.facebook.com/me?fields=name,id&access_token=${encodeURIComponent(token)}`
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ valid: false, error: data.error.message });
    }

    return NextResponse.json({ valid: true, name: data.name, id: data.id });
  } catch {
    return NextResponse.json({ valid: false, error: "Impossible de contacter Meta" }, { status: 500 });
  }
}
