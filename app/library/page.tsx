'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import { STATUSES, PLATFORMS } from '@/components/AddGameModal'
import SteamImportModal from '@/components/SteamImportModal'

interface UserGame {
  id: string
  igdb_id: number
  title: string
  cover_url: string | null
  platform: string
  status: string
  is_favorite: boolean
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  '100%': 'var(--status-done)',
  'En cours': 'var(--status-playing)',
  'Terminé': 'var(--status-finished)',
  'Abandonné': 'var(--status-dropped)',
  'À commencer': 'var(--status-backlog)',
}

export default function LibraryPage() {
  const [games, setGames] = useState<UserGame[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('Tous')
  const [filterPlatform, setFilterPlatform] = useState<string>('Toutes')
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showSteamModal, setShowSteamModal] = useState(false)
  const [editingGame, setEditingGame] = useState<UserGame | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      setUsername(profile?.username ?? null)
      fetchGames(user.id)
    })
  }, [])

  async function fetchGames(uid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setGames((data as UserGame[]) ?? [])
    setLoading(false)
  }

  async function deleteGame(id: string) {
    setDeletingId(id)
    await supabase.from('user_games').delete().eq('id', id)
    setGames((prev) => prev.filter((g) => g.id !== id))
    setDeletingId(null)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('user_games').update({ status }).eq('id', id)
    setGames((prev) => prev.map((g) => g.id === id ? { ...g, status } : g))
  }

  async function toggleFavorite(id: string, current: boolean) {
    await supabase.from('user_games').update({ is_favorite: !current }).eq('id', id)
    setGames((prev) => prev.map((g) => g.id === id ? { ...g, is_favorite: !current } : g))
  }

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (filterStatus !== 'Tous' && g.status !== filterStatus) return false
      if (filterPlatform !== 'Toutes' && g.platform !== filterPlatform) return false
      if (filterFavorite && !g.is_favorite) return false
      if (searchQuery && !g.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [games, filterStatus, filterPlatform, filterFavorite, searchQuery])

  const stats = {
    total: games.length,
    completed: games.filter((g) => g.status === '100%').length,
    playing: games.filter((g) => g.status === 'En cours').length,
    finished: games.filter((g) => g.status === 'Terminé').length,
  }

  // Set of all igdb_ids for Steam duplicate detection
  const existingIgdbIds = useMemo(() => new Set(games.map((g) => g.igdb_id)), [games])

  return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-widest mb-1"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--text-primary)' }}>
              MA BIBLIOTHÈQUE
            </h1>
            {username && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Profil public :{' '}
                <Link href={`/profile/${username}`} className="hover:underline" style={{ color: 'var(--accent-hover)' }}>
                  @{username}
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <button onClick={() => setShowSteamModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(26,159,255,0.1)', border: '1px solid rgba(26,159,255,0.3)', color: '#66c0f4' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#1b2838" stroke="rgba(100,200,255,0.4)" strokeWidth="1.5"/>
                <path d="M12 3.5C7.3 3.5 3.5 7.3 3.5 12c0 2.1.8 4 2.1 5.5l3.1-1.3c-.1-.4-.2-.7-.2-1.1 0-2 1.6-3.6 3.6-3.6 1.7 0 3.1 1.2 3.5 2.8l3.4-1.4c0-.3.1-.6.1-.9 0-4.7-3.8-8.5-8.5-8.5zM8.5 15.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" fill="#66c0f4"/>
              </svg>
              Importer depuis Steam
            </button>
            <div className="flex gap-3">
              {[
                { label: 'Total', value: stats.total, color: 'var(--text-secondary)' },
                { label: '100%', value: stats.completed, color: 'var(--status-done)' },
                { label: 'Terminé', value: stats.finished, color: 'var(--status-finished)' },
                { label: 'En cours', value: stats.playing, color: 'var(--status-playing)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-card rounded-xl px-3 py-2 text-center min-w-[60px]">
                  <div className="text-xl font-black" style={{ color, fontFamily: 'var(--font-orbitron)' }}>{value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--text-muted)' }}>⌕</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans ma bibliothèque..."
              className="input-base pl-9 text-sm py-2"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Favorite toggle */}
            <button
              onClick={() => setFilterFavorite((v) => !v)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1"
              style={{
                background: filterFavorite ? 'rgba(255,200,0,0.15)' : 'var(--bg-surface)',
                border: `1px solid ${filterFavorite ? '#fbbf24' : 'var(--border)'}`,
                color: filterFavorite ? '#fbbf24' : 'var(--text-secondary)',
              }}>
              ★ Favoris
            </button>

            {/* Status filters */}
            {['Tous', ...STATUSES.map((s) => s.value)].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: filterStatus === s ? (STATUS_COLORS[s] ?? 'var(--accent)') + '33' : 'var(--bg-surface)',
                  color: filterStatus === s ? (STATUS_COLORS[s] ?? 'var(--accent-hover)') : 'var(--text-secondary)',
                  border: `1px solid ${filterStatus === s ? (STATUS_COLORS[s] ?? 'var(--accent)') : 'var(--border)'}`,
                }}>
                {s}
              </button>
            ))}

            {/* Platform filter */}
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}
              className="input-base select text-xs py-1 w-auto" style={{ minWidth: 130 }}>
              <option value="Toutes">Toutes les plateformes</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} jeu{filtered.length > 1 ? 'x' : ''} affiché{filtered.length > 1 ? 's' : ''}
            {filtered.length !== games.length && ` sur ${games.length}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="skeleton rounded-lg" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              {games.length === 0 ? 'Ta bibliothèque est vide' : 'Aucun jeu pour ces filtres'}
            </p>
            {games.length === 0 && (
              <Link href="/search" className="btn-accent inline-flex mt-3 text-sm">
                Chercher des jeux →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 animate-fadeIn">
            {filtered.map((game) => (
              <div key={game.id} className="game-cover group">
                {game.cover_url ? (
                  <Image
                    src={game.cover_url.startsWith('http') ? game.cover_url : `https:${game.cover_url}`}
                    alt={game.title}
                    width={264}
                    height={352}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2"
                    style={{ background: 'var(--bg-hover)' }}>
                    <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
                      {game.title}
                    </span>
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="status-badge"
                    style={{
                      background: STATUS_COLORS[game.status] + '22',
                      color: STATUS_COLORS[game.status],
                      border: `1px solid ${STATUS_COLORS[game.status]}44`,
                    }}>
                    {game.status === '100%' ? '🏆 ' : ''}
                    {game.status}
                  </span>
                </div>

                {/* Favorite star */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(game.id, game.is_favorite) }}
                  className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  style={{
                    background: game.is_favorite ? 'rgba(251,191,36,0.9)' : 'rgba(0,0,0,0.6)',
                    color: game.is_favorite ? '#000' : '#fff',
                    zIndex: 10,
                    fontSize: '12px',
                  }}>
                  ★
                </button>

                {/* Pencil */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingGame(game) }}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)', zIndex: 10 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5a1.5 1.5 0 012.1 2.1L4 10.2l-2.7.6.6-2.7L8.5 1.5z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Bottom overlay */}
                <div className="overlay flex-col items-start justify-end" style={{ pointerEvents: 'none' }}>
                  <p className="text-white text-xs font-semibold leading-tight">{game.title}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{game.platform}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit modal */}
      {editingGame && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditingGame(null)}>
          <div className="glass-card rounded-2xl w-full max-w-sm mx-4 p-6 animate-fadeIn"
            style={{ border: '1px solid rgba(123,47,255,0.3)' }}>

            <div className="flex items-start gap-4 mb-5">
              {editingGame.cover_url && (
                <img
                  src={editingGame.cover_url.startsWith('http') ? editingGame.cover_url : `https:${editingGame.cover_url}`}
                  alt={editingGame.title}
                  className="w-14 rounded-lg flex-shrink-0 object-cover"
                  style={{ aspectRatio: '3/4' }}
                />
              )}
              <div>
                <h2 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {editingGame.title}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{editingGame.platform}</p>
              </div>
            </div>

            {/* Favorite toggle */}
            <button
              onClick={() => setEditingGame({ ...editingGame, is_favorite: !editingGame.is_favorite })}
              className="w-full mb-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: editingGame.is_favorite ? 'rgba(251,191,36,0.15)' : 'var(--bg-surface)',
                border: `1px solid ${editingGame.is_favorite ? '#fbbf24' : 'var(--border)'}`,
                color: editingGame.is_favorite ? '#fbbf24' : 'var(--text-secondary)',
              }}>
              ★ {editingGame.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>

            {/* Status */}
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-widest mb-2 block"
                style={{ color: 'var(--text-secondary)' }}>Statut</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((s) => (
                  <button key={s.value}
                    onClick={() => setEditingGame({ ...editingGame, status: s.value })}
                    className="rounded-lg py-2 px-3 text-sm font-medium transition-all text-left"
                    style={{
                      background: editingGame.status === s.value ? 'rgba(0,0,0,0.3)' : 'var(--bg-surface)',
                      border: `1px solid ${editingGame.status === s.value ? s.color : 'var(--border)'}`,
                      color: editingGame.status === s.value ? s.color : 'var(--text-secondary)',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-widest mb-2 block"
                style={{ color: 'var(--text-secondary)' }}>Plateforme</label>
              <select value={editingGame.platform}
                onChange={(e) => setEditingGame({ ...editingGame, platform: e.target.value })}
                className="input-base select text-sm">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => { await deleteGame(editingGame.id); setEditingGame(null) }}
                disabled={deletingId === editingGame.id}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                {deletingId === editingGame.id ? '...' : '🗑'}
              </button>
              <button onClick={() => setEditingGame(null)} className="btn-ghost flex-1 text-sm">Annuler</button>
              <button
                onClick={async () => {
                  const sb = createClient()
                  await sb.from('user_games').update({
                    status: editingGame.status,
                    platform: editingGame.platform,
                    is_favorite: editingGame.is_favorite,
                  }).eq('id', editingGame.id)
                  setGames((prev) => prev.map((g) => g.id === editingGame.id ? { ...g, ...editingGame } : g))
                  setEditingGame(null)
                }}
                className="btn-accent flex-1 text-sm">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {showSteamModal && userId && (
        <SteamImportModal
          userId={userId}
          existingIgdbIds={existingIgdbIds}
          onClose={() => setShowSteamModal(false)}
          onImported={(count) => {
            if (userId) fetchGames(userId)
            alert(`✅ ${count} jeux importés depuis Steam !`)
          }}
        />
      )}
    </>
  )
}
