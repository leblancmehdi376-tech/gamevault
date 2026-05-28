'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import { StarRating } from '@/components/AddGameModal'
import { STATUSES } from '@/components/AddGameModal'

interface UserGame {
  id: string
  title: string
  cover_url: string | null
  platform: string
  status: string
  is_favorite: boolean
  rating: number | null
}

interface Profile {
  id: string
  username: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  '100%': '#a3e635',
  'En cours': '#f59e0b',
  'Terminé': '#60a5fa',
  'Multijoueur': '#a78bfa',
  'Abandonné': '#f87171',
  'À commencer': '#94a3b8',
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [games, setGames] = useState<UserGame[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('Tous')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('username', username).single<Profile>()

      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      const { data } = await supabase
        .from('user_games').select('*').eq('user_id', prof.id)
        .order('created_at', { ascending: false }).limit(10000)

      setGames((data as UserGame[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [username])

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (filterStatus !== 'Tous' && g.status !== filterStatus) return false
      if (searchQuery && !g.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [games, filterStatus, searchQuery])

  const stats = {
    total: games.length,
    completed: games.filter((g) => g.status === '100%').length,
    finished: games.filter((g) => g.status === 'Terminé').length,
    playing: games.filter((g) => g.status === 'En cours').length,
    dropped: games.filter((g) => g.status === 'Abandonné').length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const finishedRate = stats.total > 0 ? Math.round((stats.finished / stats.total) * 100) : 0

  if (notFound) return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">👾</div>
        <p style={{ color: 'var(--text-muted)' }}>Profil introuvable</p>
      </main>
    </>
  )

  return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Profile header */}
        {profile && (
          <div className="glass-card rounded-2xl p-6 mb-6"
            style={{ border: '1px solid rgba(123,47,255,0.2)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #1a3a6a 100%)', color: '#fff', fontFamily: 'var(--font-orbitron)' }}>
                {username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-black tracking-wider"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--text-primary)' }}>
                  @{username}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Membre depuis {new Date(profile.created_at).getFullYear()}
                </p>
                <div className="flex flex-wrap gap-4 mt-3">
                  {[
                    { label: 'jeux', value: stats.total, color: 'var(--text-secondary)' },
                    { label: '100%', value: stats.completed, color: '#a3e635' },
                    { label: 'terminés', value: stats.finished, color: '#60a5fa' },
                    { label: 'en cours', value: stats.playing, color: '#f59e0b' },
                    { label: 'abandonnés', value: stats.dropped, color: '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-baseline gap-1">
                      <span className="text-xl font-black" style={{ color, fontFamily: 'var(--font-orbitron)' }}>{value}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {stats.total > 0 && (
                <div className="flex flex-col gap-3 items-end">
                  <div className="text-center">
                    <div className="text-4xl font-black" style={{ color: '#a3e635', fontFamily: 'var(--font-orbitron)' }}>{completionRate}%</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>100% rate</div>
                    <div className="mt-1.5 h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      <div className="h-full rounded-full" style={{ width: `${completionRate}%`, background: '#a3e635' }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black" style={{ color: '#60a5fa', fontFamily: 'var(--font-orbitron)' }}>{finishedRate}%</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>terminé rate</div>
                    <div className="mt-1.5 h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      <div className="h-full rounded-full" style={{ width: `${finishedRate}%`, background: '#60a5fa' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>⌕</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Rechercher dans la biblio de @${username}...`}
              className="input-base pl-9 text-sm py-2"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
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
          </div>
          {!loading && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {filtered.length}{filtered.length !== games.length && `/${games.length}`} jeux
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="skeleton rounded-lg" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">🎮</div>
            <p>{games.length === 0 ? 'Aucun jeu pour l\'instant.' : 'Aucun résultat.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 animate-fadeIn">
            {filtered.map((game) => (
              <div key={game.id} className="game-cover group">
                {game.cover_url ? (
                  <img
                    src={game.cover_url.startsWith('http') ? game.cover_url : `https:${game.cover_url}`}
                    alt={game.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2" style={{ background: 'var(--bg-hover)' }}>
                    <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{game.title}</span>
                  </div>
                )}

                <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
                  style={{ background: STATUS_COLORS[game.status] ?? '#94a3b8', boxShadow: `0 0 6px ${STATUS_COLORS[game.status] ?? '#94a3b8'}` }} />

                {game.is_favorite && (
                  <div className="absolute bottom-6 right-1.5 text-xs" style={{ filter: 'drop-shadow(0 0 4px #fbbf24)', color: '#fbbf24' }}>★</div>
                )}

                <div className="overlay flex-col items-start justify-end">
                  <p className="text-white text-xs font-semibold leading-tight mb-1">{game.title}</p>
                  <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{game.platform} · {game.status}</p>
                  {game.rating && <StarRating value={game.rating} readonly size={12} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
