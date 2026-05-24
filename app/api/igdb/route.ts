import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory token cache (resets on server restart, fine for dev)
let cachedToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`)

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 120) * 1000
  return cachedToken!
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query requis' }, { status: 400 })
    }

    const token = await getAccessToken()

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        search "${query.replace(/"/g, '')}";
        fields name, cover.url, first_release_date, platforms.name, genres.name, summary;
        limit 24;
        where cover != null;
      `,
    })

    if (!res.ok) throw new Error(`IGDB error: ${res.status}`)

    const games = await res.json()

    // Normalize cover URLs to large size
    const normalized = games.map((g: IGDBGame) => ({
      ...g,
      cover: g.cover
        ? { url: g.cover.url.replace('t_thumb', 't_cover_big') }
        : null,
    }))

    return NextResponse.json(normalized)
  } catch (err) {
    console.error('[IGDB API]', err)
    return NextResponse.json({ error: 'Erreur serveur IGDB' }, { status: 500 })
  }
}

interface IGDBGame {
  id: number
  name: string
  cover?: { url: string }
  first_release_date?: number
  platforms?: { name: string }[]
  genres?: { name: string }[]
  summary?: string
}
