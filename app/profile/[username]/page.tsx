import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import { StarRating } from '@/components/AddGameModal'

const STATUS_COLORS: Record<string, string> = {
  '100%': '#a3e635',
  'En cours': '#f59e0b',
  'Terminé': '#60a5fa',
  'Abandonné': '#f87171',
  'À commencer': '#94a3b8',
}

interface UserGame {
  id: string
  title: string
  cover_url: string | null
  platform: string
  status: string
  is_favorite: boolean
  is_multi: boolean
  rating: number | null
}

interface Profile {
  id: string
  username: string
  created_at: string
}

export const revalidate = 0

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('username', username).single<Profile>()

  if (!profile) notFound()

  const { data: games } = await supabase
    .from('user_games').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(10000)

  const userGames = (games as UserGame[]) ?? []

  const stats = {
    total: userGames.length,
    completed: userGames.filter((g) => g.status === '100%').length,
    finished: userGames.filter((g) => g.status === 'Terminé').length,
    playing: userGames.filter((g) => g.status === 'En cours').length,
    dropped: userGames.filter((g) => g.status === 'Abandonné').length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const finishedRate = stats.total > 0 ? Math.round((stats.finished / stats.total) * 100) : 0
  const memberSince = new Date(profile.created_at).getFullYear()

  return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Profile header */}
        <div className="glass-card rounded-2xl p-6 mb-8"
          style={{ border: '1px solid rgba(123,47,255,0.2)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #1a3a6a 100%)',
                color: '#fff',
                fontFamily: 'var(--font-orbitron)',
              }}>
              {username[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-black tracking-wider"
                style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--text-primary)' }}>
                @{username}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Membre depuis {memberSince}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mt-3">
                {[
                  { label: 'jeux', value: stats.total, color: 'var(--text-secondary)' },
                  { label: '100%', value: stats.completed, color: '#a3e635' },
                  { label: 'terminés', value: stats.finished, color: '#60a5fa' },
                  { label: 'en cours', value: stats.playing, color: '#f59e0b' },
                  { label: 'abandonnés', value: stats.dropped, color: '#f87171' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-baseline gap-1">
                    <span className="text-xl font-black" style={{ color, fontFamily: 'var(--font-orbitron)' }}>
                      {value}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate badges */}
            {stats.total > 0 && (
              <div className="flex flex-col gap-3 items-end">
                <div className="text-center">
                  <div className="text-4xl font-black" style={{ color: '#a3e635', fontFamily: 'var(--font-orbitron)' }}>
                    {completionRate}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>100% rate</div>
                  <div className="mt-1.5 h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                    <div className="h-full rounded-full" style={{ width: `${completionRate}%`, background: '#a3e635' }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black" style={{ color: '#60a5fa', fontFamily: 'var(--font-orbitron)' }}>
                    {finishedRate}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>terminé rate</div>
                  <div className="mt-1.5 h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                    <div className="h-full rounded-full" style={{ width: `${finishedRate}%`, background: '#60a5fa' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Games grid */}
        {userGames.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">🎮</div>
            <p>Aucun jeu dans la bibliothèque pour l&apos;instant.</p>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-orbitron)' }}>
              Bibliothèque ({userGames.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {userGames.map((game) => (
                <div key={game.id} className="game-cover">
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
                      <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                        {game.title}
                      </span>
                    </div>
                  )}

                  {/* Status dot */}
                  <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
                    style={{ background: STATUS_COLORS[game.status], boxShadow: `0 0 6px ${STATUS_COLORS[game.status]}` }} />

                  {/* Multi badge */}
                  {game.is_multi && (
                    <div className="absolute top-1.5 left-5 px-1 py-0.5 rounded text-xs font-bold leading-none"
                      style={{ background: 'rgba(123,47,255,0.8)', color: '#fff', fontSize: '9px' }}>
                      MULTI
                    </div>
                  )}

                  {/* Favorite */}
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
          </>
        )}
      </main>
    </>
  )
}
