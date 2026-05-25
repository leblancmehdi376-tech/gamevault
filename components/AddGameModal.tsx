'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Nintendo Switch 2', 'Wii U', 'Wii', 'GameCube', '3DS', 'DS', 'Game Boy', 'iOS', 'Android']
export const STATUSES = [
  { value: '100%', label: '100% 🏆', color: 'var(--status-done)' },
  { value: 'En cours', label: 'En cours ▶', color: 'var(--status-playing)' },
  { value: 'Terminé', label: 'Terminé ✓', color: 'var(--status-finished)' },
  { value: 'Multijoueur', label: 'Multijoueur 🎮', color: '#a78bfa' },
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

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 16,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: number
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star === value ? 0 : star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            style={{
              color: filled ? '#fbbf24' : 'rgba(255,255,255,0.2)',
              fontSize: size,
              lineHeight: 1,
              cursor: readonly ? 'default' : 'pointer',
              background: 'none',
              border: 'none',
              padding: '0 1px',
              transition: 'color 0.1s',
              filter: filled ? 'drop-shadow(0 0 4px #fbbf2488)' : 'none',
            }}>
            ★
          </button>
        )
      })}
    </div>
  )
}

export default function AddGameModal({ game, userId, onClose, onAdded }: Props) {
  const [platform, setPlatform] = useState('PC')
  const [status, setStatus] = useState('En cours')
  const [rating, setRating] = useState(0)
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
      rating: rating || null,
    })
    setLoading(false)
    if (error) setError(error.message)
    else { onAdded(); onClose() }
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
          {/* Platform */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'var(--text-secondary)' }}>Plateforme</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-base select">
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'var(--text-secondary)' }}>Statut</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className="rounded-lg py-2 px-3 text-sm font-medium transition-all text-left"
                  style={{
                    background: status === s.value ? 'rgba(0,0,0,0.3)' : 'var(--bg-surface)',
                    border: `1px solid ${status === s.value ? s.color : 'var(--border)'}`,
                    color: status === s.value ? s.color : 'var(--text-secondary)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block"
              style={{ color: 'var(--text-secondary)' }}>Note</label>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size={22} />
              {rating > 0 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rating}/5</span>
              )}
              {rating > 0 && (
                <button onClick={() => setRating(0)} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--status-dropped)' }}>{error}</p>}

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
