'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

interface Profile {
  id: string
  username: string
  created_at: string
}

interface PlayerStats {
  total: number
  completed: number
  finished: number
  playing: number
}

export default function PlayersPage() {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [statsMap, setStatsMap] = useState<Record<string, PlayerStats>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: gameCounts } = await supabase
      .from('user_games')
      .select('user_id, status')

    const map: Record<string, PlayerStats> = {}
    for (const row of (gameCounts ?? [])) {
      if (!map[row.user_id]) map[row.user_id] = { total: 0, completed: 0, finished: 0, playing: 0 }
      map[row.user_id].total++
      if (row.status === '100%') map[row.user_id].completed++
      if (row.status === 'Terminé') map[row.user_id].finished++
      if (row.status === 'En cours') map[row.user_id].playing++
    }

    setAllProfiles((profiles as Profile[]) ?? [])
    setStatsMap(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-widest mb-1"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--text-primary)' }}>
              LES POTES
            </h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              {allProfiles.length} joueur{allProfiles.length > 1 ? 's' : ''} inscrit{allProfiles.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={fetchData}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
            ↺ Actualiser
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: 100 }} />
            ))}
          </div>
        )}

        {!loading && allProfiles.length === 0 && (
          <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">👾</div>
            <p>Aucun joueur pour l&apos;instant</p>
          </div>
        )}

        {!loading && allProfiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allProfiles.map((profile) => {
              const s = statsMap[profile.id] ?? { total: 0, completed: 0, finished: 0, playing: 0 }
              const completionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
              const finishedRate = s.total > 0 ? Math.round((s.finished / s.total) * 100) : 0
              const letter = profile.username[0].toUpperCase()
              const memberYear = new Date(profile.created_at).getFullYear()

              return (
                <Link key={profile.id} href={`/profile/${profile.username}`}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 transition-all group no-underline"
                  style={{ border: '1px solid var(--border)' }}>

                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0 transition-all group-hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent) 0%, #1a3a6a 100%)',
                      color: '#fff',
                      fontFamily: 'var(--font-orbitron)',
                    }}>
                    {letter}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      @{profile.username}
                    </p>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      Depuis {memberYear}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        🎮 {s.total}
                      </span>
                      {s.completed > 0 && (
                        <span className="text-xs font-bold" style={{ color: 'var(--status-done)' }}>
                          🏆 {s.completed}
                        </span>
                      )}
                      {s.finished > 0 && (
                        <span className="text-xs font-bold" style={{ color: 'var(--status-finished)' }}>
                          ✓ {s.finished}
                        </span>
                      )}
                      {s.playing > 0 && (
                        <span className="text-xs" style={{ color: 'var(--status-playing)' }}>
                          ▶ {s.playing}
                        </span>
                      )}
                    </div>

                    {/* Double progress bar */}
                    {s.total > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {/* 100% bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                            <div className="h-full rounded-full" style={{ width: `${completionRate}%`, background: 'var(--status-done)' }} />
                          </div>
                          <span className="text-xs font-bold w-7 text-right" style={{ color: 'var(--status-done)' }}>
                            {completionRate}%
                          </span>
                        </div>
                        {/* Terminé bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                            <div className="h-full rounded-full" style={{ width: `${finishedRate}%`, background: 'var(--status-finished)' }} />
                          </div>
                          <span className="text-xs font-bold w-7 text-right" style={{ color: 'var(--status-finished)' }}>
                            {finishedRate}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--accent-hover)' }}>→</span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
