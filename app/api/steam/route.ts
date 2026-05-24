import { NextRequest, NextResponse } from 'next/server'

const STEAM_KEY = process.env.STEAM_API_KEY!

// Extrait le SteamID64 ou la vanity URL depuis une URL de profil Steam
function parseSteamUrl(url: string): { type: 'id64' | 'vanity'; value: string } | null {
  try {
    const u = new URL(url.trim())
    const parts = u.pathname.replace(/\/$/, '').split('/')
    // /profiles/76561198... → SteamID64 direct
    if (parts[1] === 'profiles' && parts[2]) {
      return { type: 'id64', value: parts[2] }
    }
    // /id/NekoZ18_ → vanity URL
    if (parts[1] === 'id' && parts[2]) {
      return { type: 'vanity', value: parts[2] }
    }
    return null
  } catch {
    return null
  }
}

async function resolveVanity(vanity: string): Promise<string | null> {
  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_KEY}&vanityurl=${vanity}`
  )
  const data = await res.json()
  if (data.response?.success === 1) return data.response.steamid
  return null
}

async function getOwnedGames(steamId: string) {
  const res = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`
  )
  const data = await res.json()
  return data.response?.games ?? []
}

async function getPlayerSummary(steamId: string) {
  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${steamId}`
  )
  const data = await res.json()
  return data.response?.players?.[0] ?? null
}

export async function POST(req: NextRequest) {
  try {
    const { profileUrl } = await req.json()
    if (!profileUrl) return NextResponse.json({ error: 'URL requise' }, { status: 400 })

    if (!STEAM_KEY || STEAM_KEY === 'METS_TA_CLE_ICI') {
      return NextResponse.json(
        { error: 'Clé API Steam manquante — ajoute STEAM_API_KEY dans .env.local' },
        { status: 500 }
      )
    }

    const parsed = parseSteamUrl(profileUrl)
    if (!parsed) {
      return NextResponse.json(
        { error: 'URL Steam invalide. Format attendu : steamcommunity.com/id/TON_PSEUDO ou /profiles/76561...' },
        { status: 400 }
      )
    }

    let steamId64 = parsed.value
    if (parsed.type === 'vanity') {
      const resolved = await resolveVanity(parsed.value)
      if (!resolved) {
        return NextResponse.json({ error: 'Profil Steam introuvable ou privé' }, { status: 404 })
      }
      steamId64 = resolved
    }

    const [games, player] = await Promise.all([
      getOwnedGames(steamId64),
      getPlayerSummary(steamId64),
    ])

    if (!games.length) {
      return NextResponse.json(
        { error: 'Bibliothèque vide ou privée. Rends la bibliothèque publique dans les paramètres Steam.' },
        { status: 404 }
      )
    }

    // Trie par temps de jeu décroissant, normalise les covers
    const normalized = games
      .sort((a: SteamGame, b: SteamGame) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
      .map((g: SteamGame) => ({
        appid: g.appid,
        name: g.name,
        playtime_hours: Math.round((g.playtime_forever ?? 0) / 60),
        // Cover portrait haute qualité Steam
        cover_url: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
        // Fallback header
        header_url: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      }))

    return NextResponse.json({
      player: {
        name: player?.personaname ?? 'Inconnu',
        avatar: player?.avatarfull ?? null,
        steamId: steamId64,
      },
      games: normalized,
      total: normalized.length,
    })
  } catch (err) {
    console.error('[Steam API]', err)
    return NextResponse.json({ error: 'Erreur serveur Steam' }, { status: 500 })
  }
}

interface SteamGame {
  appid: number
  name: string
  playtime_forever?: number
}
