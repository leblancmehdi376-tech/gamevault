'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Nintendo Switch 2', 'Wii U', 'Wii', 'GameCube', '3DS', 'DS', 'Game Boy', 'iOS', 'Android']
export const STATUSES = [
  { value: '100%', label: '100% 🏆', color: 'var(--status-done)' },
  { value: 'En cours', label: 'En cours ▶', color: 'var(--status-playing)' },
  { value: 'Terminé', label: 'Terminé ✓', color: 'var(--status-finished)' },
  { value: 'Abandonné', label: 'Abandonné ✗', color: 'var(--status-dropped)' },
  { value: 'À commencer', label: 'À commencer ◷', color: 'var(--status-backlog)' },
]

export interface IGDBGameResult {
  id: number
  name: string
  cover?: { url: string }
  first_release_date?: number
}

interface Props {
  game: IGDBGameResult
  userId: string
  onClose: () => void
  onAdded: () => void
}

export default function AddGameModal({ game, userId, onClose, onAdded }: Props) {
  const [platform, setPlatform] = useState('PC')
  const [status, setStatus] = useState('En cours')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleAdd() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('user_games').insert({
      user_id: userId,
      igdb_id: game.id,
      title: game.name,
      cover_url: game.cover?.url ?? null,
      platform,
      status,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onAdded()
      onClose()
    }
  }

  const year = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card rounded-2xl w-full max-w-sm mx-4 p-6 animate-fadeIn"
        style={{ border: '1px solid rgba(123,47,255,0.3)' }}>

        <div className="flex items-start gap-4 mb-6">
          {game.cover && (
            <img src={game.cover.url} alt={game.name}
              className="w-16 rounded-lg flex-shrink-0 object-cover"
              style={{ aspectRatio: '3/4', background: 'var(--bg-hover)' }} />
          )}
          <div>
            <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
              {game.name}
            </h2>
            {year && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{year}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'var(--text-secondary)' }}>
              Plateforme
            </label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-base select">
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'var(--text-secondary)' }}>
              Statut
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className="rounded-lg py-2 px-3 text-sm font-medium transition-all text-left"
                  style={{
                    background: status === s.value ? 'rgba(0,0,0,0.3)' : 'var(--bg-surface)',
                    border: `1px solid ${status === s.value ? s.color : 'var(--border)'}`,
                    color: status === s.value ? s.color : 'var(--text-secondary)',
                    boxShadow: status === s.value ? `0 0 10px ${s.color}30` : 'none',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--status-dropped)' }}>{error}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
            <button onClick={handleAdd} disabled={loading} className="btn-accent flex-1">
              {loading ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
