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
  onClose: () => void
  onImported: (count: number) => void
}

export default function SteamImportModal({ userId, onClose, onImported }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [player, setPlayer] = useState<SteamPlayer | null>(null)
  const [games, setGames] = useState<SteamGame[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [platform] = useState('PC')
  const [defaultStatus, setDefaultStatus] = useState('À commencer')
  const [coverErrors, setCoverErrors] = useState<Set<number>>(new Set())

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
      // Sélectionne tout par défaut
      setSelected(new Set(data.games.map((g: SteamGame) => g.appid)))
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
      .map((g) => ({
        user_id: userId,
        igdb_id: g.appid * -1, // IDs Steam négatifs pour ne pas entrer en conflit avec IGDB
        title: g.name,
        cover_url: coverErrors.has(g.appid) ? null : g.cover_url.replace('https:', ''),
        platform,
        status: defaultStatus,
      }))

    // Insert par batch de 50
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

  const STATUSES = ['À commencer', 'En cours', 'Terminé', '100%', 'Abandonné']

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card rounded-2xl w-full max-w-2xl mx-4 flex flex-col animate-fadeIn"
        style={{
          border: '1px solid rgba(100,200,100,0.2)',
          maxHeight: '85vh',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            {/* Steam logo SVG */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#1b2838" stroke="rgba(100,200,255,0.3)" strokeWidth="1"/>
              <path d="M12 3.5C7.3 3.5 3.5 7.3 3.5 12c0 2.1.8 4 2.1 5.5l3.1-1.3c-.1-.4-.2-.7-.2-1.1 0-2 1.6-3.6 3.6-3.6 1.7 0 3.1 1.2 3.5 2.8l3.4-1.4c0-.3.1-.6.1-.9 0-4.7-3.8-8.5-8.5-8.5zM8.5 15.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zm3.5 1c.6 1.3 1.9 2.1 3.4 2.1 2 0 3.6-1.6 3.6-3.6 0-2-1.6-3.6-3.6-3.6-.3 0-.5 0-.8.1L15 14c.8.3 1.3 1 1.3 1.9 0 1.1-.9 2-2 2-.9 0-1.7-.6-1.9-1.4l-1.1-1.4.7 1.4z" fill="#66c0f4"/>
            </svg>
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                Import depuis Steam
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Colle l'URL d'un profil Steam pour importer sa bibliothèque
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-xl leading-none transition-colors"
            style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* URL input */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLibrary()}
              placeholder="https://steamcommunity.com/id/NekoZ18_/ ou /profiles/76561..."
              className="input-base text-sm flex-1"
            />
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

          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="animate-spin inline-block">⟳</span> Récupération de la bibliothèque Steam...
            </div>
          )}
        </div>

        {/* Player info + options */}
        {player && games.length > 0 && (
          <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: 'var(--border)', background: 'rgba(100,200,100,0.03)' }}>
            <div className="flex items-center gap-3">
              {player.avatar && (
                <img src={player.avatar} alt={player.name}
                  className="w-10 h-10 rounded-lg" />
              )}
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {player.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {games.length} jeux • {selected.size} sélectionnés
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Statut par défaut</label>
                <select value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value)}
                  className="input-base select text-xs py-1" style={{ width: 140 }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search + select all */}
        {games.length > 0 && (
          <div className="px-6 py-3 border-b flex gap-2 items-center" style={{ borderColor: 'var(--border)' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer les jeux..."
              className="input-base text-sm py-1.5 flex-1"
            />
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
                const hasError = coverErrors.has(game.appid)
                return (
                  <div key={game.appid}
                    onClick={() => toggleGame(game.appid)}
                    className="relative cursor-pointer rounded-lg overflow-hidden transition-all"
                    style={{
                      aspectRatio: '3/4',
                      background: 'var(--bg-hover)',
                      outline: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                      opacity: isSelected ? 1 : 0.4,
                      transform: isSelected ? 'scale(1)' : 'scale(0.97)',
                    }}>

                    <img
                      src={hasError ? game.header_url : game.cover_url}
                      alt={game.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (!hasError) setCoverErrors((prev) => new Set(prev).add(game.appid))
                      }}
                    />

                    {/* Selection checkmark */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ background: 'var(--accent)', color: '#fff' }}>
                        ✓
                      </div>
                    )}

                    {/* Playtime badge */}
                    {game.playtime_hours > 0 && (
                      <div className="absolute bottom-0 inset-x-0 px-1.5 py-1"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                        <p className="text-white text-xs font-semibold truncate leading-tight">{game.name}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {game.playtime_hours}h
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {games.length > 0 && (
          <div className="p-4 border-t flex items-center justify-between gap-3"
            style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {selected.size} jeu{selected.size > 1 ? 'x' : ''} à importer sur PC
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost text-sm px-4">Annuler</button>
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="btn-accent text-sm px-5">
                {importing
                  ? `Import... (${selected.size})`
                  : `Importer ${selected.size} jeux`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
