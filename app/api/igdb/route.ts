import { NextRequest, NextResponse } from 'next/server'

let cachedToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST', cache: 'no-store' }
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Twitch token error ${res.status}: ${txt}`)
  }

  const data = await res.json()
  if (!data.access_token) throw new Error(`No access_token in response: ${JSON.stringify(data)}`)

  cachedToken = data.access_token
  tokenExpiry = Date.now() + Math.min((data.expires_in - 300) * 1000, 23 * 60 * 60 * 1000)
  return cachedToken!
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query requis' }, { status: 400 })
    }

    const token = await getAccessToken()
    const safeQuery = query.replace(/"/g, '').replace(/'/g, '').trim()

    const body = `search "${safeQuery}"; fields name,cover.url,first_release_date,platforms.name,genres.name,summary; limit 30;`

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
        'Accept': 'application/json',
      },
      body,
    })

    if (res.status === 401) {
      // Token stale — force refresh
      cachedToken = null
      tokenExpiry = 0
      return NextResponse.json({ error: 'Token expiré, réessaie dans 2 secondes.' }, { status: 503 })
    }

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`IGDB error ${res.status}: ${txt}`)
    }

    const games = await res.json()

    if (!Array.isArray(games)) {
      throw new Error(`IGDB response non-array: ${JSON.stringify(games)}`)
    }

    // Sort: with cover first
    const sorted = [...games].sort((a: IGDBGame, b: IGDBGame) => {
      if (a.cover && !b.cover) return -1
      if (!a.cover && b.cover) return 1
      return 0
    })

    const normalized = sorted.map((g: IGDBGame) => ({
      ...g,
      cover: g.cover
        ? { url: 'https:' + g.cover.url.replace('t_thumb', 't_cover_big').replace(/^https?:/, '') }
        : null,
    }))

    return NextResponse.json(normalized)
  } catch (err) {
    console.error('[IGDB API]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
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
