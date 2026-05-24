'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

interface SteamGame {
  appid: number
  name: string
  playtime_hours: number
  cover_url: string
  header_url: string
}

interface SteamPlayer {
  name: string
  avatar: string | null
  steamId: string
}

interface Props {
  userId: string
  existingIgdbIds: Set<number>  // already in library (positive ids for IGDB, negative for Steam)
  onClose: () => void
  onImported: (count: number) => void
}

// Steam IDs are stored as negative numbers to avoid collision with IGDB
function steamToDbId(appid: number) { return appid * -1 }

export default function SteamImportModal({ userId, existingIgdbIds, onClose, onImported }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [player, setPlayer] = useState<SteamPlayer | null>(null)
  const [games, setGames] = useState<SteamGame[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [defaultStatus, setDefaultStatus] = useState('À commencer')
  const [coverErrors, setCoverErrors] = useState<Set<number>>(new Set())
  const [headerErrors, setHeaderErrors] = useState<Set<number>>(new Set())

  const supabase = createClient()

  async function fetchLibrary() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setGames([])
    setSelected(new Set())
    try {
      const res = await fetch('/api/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlayer(data.player)
      setGames(data.games)
      // Pre-select only games NOT already in library
      const newGames = new Set<number>(
        data.games
          .filter((g: SteamGame) => !existingIgdbIds.has(steamToDbId(g.appid)))
          .map((g: SteamGame) => g.appid as number)
      )
      setSelected(newGames)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!selected.size) return
    setImporting(true)
    setError(null)

    const toInsert = games
      .filter((g) => selected.has(g.appid))
      .map((g) => {
        // Build best cover URL
        let cover = null
        if (!coverErrors.has(g.appid)) cover = g.cover_url.replace('https:', '')
        else if (!headerErrors.has(g.appid)) cover = g.header_url.replace('https:', '')
        return {
          user_id: userId,
          igdb_id: steamToDbId(g.appid),
          title: g.name,
          cover_url: cover,
          platform: 'PC',
          status: defaultStatus,
        }
      })

    let imported = 0
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50)
      const { error } = await supabase
        .from('user_games')
        .upsert(batch, { onConflict: 'user_id,igdb_id,platform', ignoreDuplicates: true })
      if (!error) imported += batch.length
    }

    setImporting(false)
    onImported(imported)
    onClose()
  }

  function toggleGame(appid: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(appid) ? next.delete(appid) : next.add(appid)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((g) => g.appid)))
  }

  const filtered = useMemo(() =>
    games.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
    [games, search]
  )

  const alreadyOwned = useMemo(() =>
    games.filter((g) => existingIgdbIds.has(steamToDbId(g.appid))).length,
    [games, existingIgdbIds]
  )

  const STATUSES = ['À commencer', 'En cours', 'Terminé', '100%', 'Abandonné']

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card rounded-2xl w-full max-w-2xl mx-4 flex flex-col animate-fadeIn"
        style={{ border: '1px solid rgba(100,200,100,0.2)', maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#1b2838" stroke="rgba(100,200,255,0.3)" strokeWidth="1"/>
              <path d="M12 3.5C7.3 3.5 3.5 7.3 3.5 12c0 2.1.8 4 2.1 5.5l3.1-1.3c-.1-.4-.2-.7-.2-1.1 0-2 1.6-3.6 3.6-3.6 1.7 0 3.1 1.2 3.5 2.8l3.4-1.4c0-.3.1-.6.1-.9 0-4.7-3.8-8.5-8.5-8.5zM8.5 15.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" fill="#66c0f4"/>
            </svg>
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Import depuis Steam</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Colle l'URL d'un profil Steam</p>
            </div>
          </div>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* URL input */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLibrary()}
              placeholder="https://steamcommunity.com/id/NekoZ18_/"
              className="input-base text-sm flex-1" />
            <button onClick={fetchLibrary} disabled={loading || !url.trim()} className="btn-accent text-sm px-4 flex-shrink-0">
              {loading ? '⟳' : 'Charger'}
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded-lg px-4 py-3 text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}
        </div>

        {/* Player info */}
        {player && games.length > 0 && (
          <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: 'var(--border)', background: 'rgba(100,200,100,0.03)' }}>
            <div className="flex items-center gap-3">
              {player.avatar && <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-lg" />}
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{player.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {games.length} jeux
                  {alreadyOwned > 0 && (
                    <span style={{ color: 'var(--status-done)' }}> · {alreadyOwned} déjà dans ta biblio</span>
                  )}
                  <span style={{ color: 'var(--accent-hover)' }}> · {selected.size} sélectionnés</span>
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Statut par défaut</label>
              <select value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value)}
                className="input-base select text-xs py-1" style={{ width: 140 }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Search + select all */}
        {games.length > 0 && (
          <div className="px-6 py-3 border-b flex gap-2" style={{ borderColor: 'var(--border)' }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer les jeux..." className="input-base text-sm py-1.5 flex-1" />
            <button onClick={toggleAll} className="btn-ghost text-xs px-3 py-1.5 flex-shrink-0">
              {selected.size === filtered.length ? 'Tout désélect.' : 'Tout sélect.'}
            </button>
          </div>
        )}

        {/* Games grid */}
        {games.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {filtered.map((game) => {
                const isSelected = selected.has(game.appid)
                const alreadyIn = existingIgdbIds.has(steamToDbId(game.appid))
                const showHeader = coverErrors.has(game.appid)
                const noImage = showHeader && headerErrors.has(game.appid)
                const imgSrc = showHeader ? game.header_url : game.cover_url

                return (
                  <div key={game.appid}
                    onClick={() => !alreadyIn && toggleGame(game.appid)}
                    className="relative rounded-lg overflow-hidden transition-all"
                    style={{
                      aspectRatio: '3/4',
                      background: 'var(--bg-hover)',
                      outline: alreadyIn ? '2px solid var(--status-done)' : isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                      opacity: alreadyIn ? 0.6 : isSelected ? 1 : 0.4,
                      cursor: alreadyIn ? 'default' : 'pointer',
                      transform: isSelected && !alreadyIn ? 'scale(1)' : 'scale(0.97)',
                    }}>

                    {noImage ? (
                      <div className="w-full h-full flex items-center justify-center p-1"
                        style={{ background: 'var(--bg-surface)' }}>
                        <p className="text-center text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                          {game.name}
                        </p>
                      </div>
                    ) : (
                      <img src={imgSrc} alt={game.name}
                        className="w-full h-full object-cover"
                        onError={() => {
                          if (!showHeader) setCoverErrors((p) => new Set(p).add(game.appid))
                          else setHeaderErrors((p) => new Set(p).add(game.appid))
                        }}
                      />
                    )}

                    {/* Badge */}
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{
                        background: alreadyIn ? 'var(--status-done)' : isSelected ? 'var(--accent)' : 'transparent',
                        color: '#000',
                        display: alreadyIn || isSelected ? 'flex' : 'none',
                      }}>
                      {alreadyIn ? '✓' : '✓'}
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 inset-x-0 px-1.5 py-1"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                      <p className="text-white text-xs font-semibold truncate leading-tight">{game.name}</p>
                      {game.playtime_hours > 0 && (
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{game.playtime_hours}h</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {games.length > 0 && (
          <div className="p-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {selected.size} jeu{selected.size > 1 ? 'x' : ''} à importer
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost text-sm px-4">Annuler</button>
              <button onClick={handleImport} disabled={importing || selected.size === 0} className="btn-accent text-sm px-5">
                {importing ? `Import... (${selected.size})` : `Importer ${selected.size} jeux`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
