import { NextResponse } from 'next/server'

export async function GET() {
  const nøkkel = process.env.UNSPLASH_ACCESS_KEY
  if (!nøkkel) return NextResponse.json({ feil: 'Mangler nøkkel' }, { status: 500 })

  try {
    const søkeord = [
    'scandinavian interior plants',
    'japandi interior plants',
    'mid century modern houseplants',
    'minimal interior botanical',
    'nordic home plants styling',
    'japandi living room plants',
    'indoor plants aesthetic interior',
    'mid century modern indoor garden',
  ]
    const tilfeldig = søkeord[Math.floor(Math.random() * søkeord.length)]

    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(tilfeldig)}&orientation=landscape&count=6`,
      { headers: { Authorization: `Client-ID ${nøkkel}` }, next: { revalidate: 3600 } }
    )
    const data = await res.json()
    if (!Array.isArray(data)) return NextResponse.json({ bilder: [] })

    const bilder = data.map((b: any) => ({
      id: b.id,
      url: b.urls.regular,
      tommel: b.urls.small,
      fotograf: b.user.name,
      fotografUrl: b.user.links.html,
      unsplashUrl: b.links.html,
      downloadUrl: b.links.download_location,
    }))

    return NextResponse.json({ bilder })
  } catch (e) {
    return NextResponse.json({ feil: 'Kunne ikke hente bilder' }, { status: 500 })
  }
}
