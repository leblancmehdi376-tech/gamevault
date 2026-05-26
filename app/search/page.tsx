'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import AddGameModal, { type IGDBGameResult } from '@/components/AddGameModal'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IGDBGameResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<IGDBGameResult | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (!query.trim() || query.length < 2) { setResults([]); return }
    timeoutRef.current = setTimeout(() => search(query), 400)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [query])

  async function search(q: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/igdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleAdded() {
    if (selectedGame) setAddedIds((prev) => new Set(prev).add(selectedGame.id))
  }

  return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-widest mb-1"
            style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--text-primary)' }}>
            RECHERCHER
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Trouve un jeu via IGDB et ajoute-le à ta bibliothèque
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-8 max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: 'var(--text-muted)' }}>⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom du jeu (ex: Dark Souls, Celeste...)"
            className="input-base pl-10"
            autoFocus
          />
          {loading && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--text-muted)' }}>
              ⟳
            </span>
          )}
        </div>

        {/* Results grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 animate-fadeIn">
            {results.map((game) => {
              const isAdded = addedIds.has(game.id)
              const year = game.first_release_date
                ? new Date(game.first_release_date * 1000).getFullYear()
                : null
              return (
                <div key={game.id}
                  className="game-cover cursor-pointer group"
                  onClick={() => !isAdded && setSelectedGame(game)}
                  style={{ opacity: isAdded ? 0.5 : 1 }}>
                  {game.cover ? (
                    <img
                      src={game.cover.url}
                      alt={game.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2"
                      style={{ background: 'var(--bg-hover)' }}>
                      <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                        {game.name}
                      </span>
                    </div>
                  )}
                  <div className="overlay flex-col items-start justify-end">
                    <p className="text-white text-xs font-semibold leading-tight mb-0.5">{game.name}</p>
                    {year && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{year}</p>}
                    <span className="mt-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: isAdded ? 'var(--status-done)' : 'var(--accent)', color: '#fff' }}>
                      {isAdded ? '✓ Ajouté' : '+ Ajouter'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            Aucun résultat pour « {query} »
          </p>
        )}

        {query.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">🎮</div>
            <p>Commence à taper pour rechercher un jeu</p>
          </div>
        )}
      </main>

      {selectedGame && userId && (
        <AddGameModal
          game={selectedGame}
          userId={userId}
          onClose={() => setSelectedGame(null)}
          onAdded={handleAdded}
        />
      )}
    </>
  )
}
