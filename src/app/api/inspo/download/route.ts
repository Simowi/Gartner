import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ ok: false })
  const nøkkel = process.env.UNSPLASH_ACCESS_KEY
  if (!nøkkel) return NextResponse.json({ ok: false })
  try {
    await fetch(url, { headers: { Authorization: `Client-ID ${nøkkel}` } })
  } catch (e) {}
  return NextResponse.json({ ok: true })
}
