'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

interface Profile {
  id: string
  username: string
  created_at: string
}

interface GameCount {
  user_id: string
  count: number
  completed: number
}

export default function PlayersPage() {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [countMap, setCountMap] = useState<Record<string, GameCount>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: gameCounts } = await supabase
        .from('user_games')
        .select('user_id, status')

      const map: Record<string, GameCount> = {}
      for (const row of gameCounts ?? []) {
        if (!map[row.user_id]) map[row.user_id] = { user_id: row.user_id, count: 0, completed: 0 }
        map[row.user_id].count++
        if (row.status === '100%') map[row.user_id].completed++
      }

      setAllProfiles((profiles as Profile[]) ?? [])
      setCountMap(map)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-widest mb-1"
            style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--text-primary)' }}>
            LES POTES
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            {allProfiles.length} joueur{allProfiles.length > 1 ? 's' : ''} inscrit{allProfiles.length > 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: 88 }} />
            ))}
          </div>
        ) : allProfiles.length === 0 ? (
          <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">👾</div>
            <p>Aucun joueur pour l&apos;instant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allProfiles.map((profile) => {
              const stats = countMap[profile.id] ?? { count: 0, completed: 0 }
              const completionRate = stats.count > 0
                ? Math.round((stats.completed / stats.count) * 100)
                : 0
              const letter = profile.username[0].toUpperCase()
              const memberYear = new Date(profile.created_at).getFullYear()

              return (
                <Link key={profile.id} href={`/profile/${profile.username}`}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 transition-all group no-underline"
                  style={{ border: '1px solid var(--border)' }}
>

                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0 transition-all group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, var(--accent) 0%, #1a3a6a 100%)`,
                      color: '#fff',
                      fontFamily: 'var(--font-orbitron)',
                    }}>
                    {letter}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      @{profile.username}
                    </p>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      Depuis {memberYear}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        🎮 {stats.count} jeux
                      </span>
                      {stats.completed > 0 && (
                        <span className="text-xs font-bold" style={{ color: 'var(--status-done)' }}>
                          🏆 {stats.completed} × 100%
                        </span>
                      )}
                    </div>

                    {/* Completion bar */}
                    {stats.count > 0 && (
                      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${completionRate}%`,
                            background: completionRate === 100
                              ? 'var(--status-done)'
                              : `linear-gradient(90deg, var(--accent), var(--status-done))`,
                          }} />
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--accent-hover)' }}>
                    →
                  </span>
                </Link>
              )
            })}
          </div>
        ) : null}
      </main>
    </>
  )
}
