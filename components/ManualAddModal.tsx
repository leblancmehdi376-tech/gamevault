'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PLATFORMS, STATUSES } from '@/components/AddGameModal'

interface Props {
  initialTitle?: string
  userId: string
  onClose: () => void
  onAdded: () => void
}

export default function ManualAddModal({ initialTitle = '', userId, onClose, onAdded }: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [coverUrl, setCoverUrl] = useState('')
  const [platform, setPlatform] = useState('PC')
  const [status, setStatus] = useState('En cours')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Generate a unique negative ID for manual entries (won't clash with IGDB or Steam)
  function manualId() {
    return -(Date.now() % 2147483647)
  }

  async function handleAdd() {
    if (!title.trim()) { setError('Le titre est obligatoire'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('user_games').insert({
      user_id: userId,
      igdb_id: manualId(),
      title: title.trim(),
      cover_url: coverUrl.trim() || null,
      platform,
      status,
    })

    setLoading(false)
    if (error) setError(error.message)
    else { onAdded(); onClose() }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card rounded-2xl w-full max-w-sm mx-4 p-6 animate-fadeIn"
        style={{ border: '1px solid rgba(123,47,255,0.3)' }}>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-accent)' }}>
            ✏️
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Ajout manuel
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Le jeu n'est pas dans IGDB ? Ajoute-le toi-même.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'var(--text-secondary)' }}>Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="We Were Here Too"
              className="input-base"
              autoFocus
            />
          </div>

          {/* Cover URL */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'var(--text-secondary)' }}>
              Image (URL) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— optionnel</span>
            </label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="input-base text-sm"
            />
            {/* Preview */}
            {coverUrl.trim() && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={coverUrl.trim()}
                  alt="preview"
                  className="w-12 rounded-lg object-cover flex-shrink-0"
                  style={{ aspectRatio: '3/4', background: 'var(--bg-hover)' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Colle l'URL d'une image depuis Google Images, SteamDB, etc.
                </p>
              </div>
            )}
          </div>

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

          {error && (
            <p className="text-sm" style={{ color: 'var(--status-dropped)' }}>{error}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
            <button onClick={handleAdd} disabled={loading || !title.trim()} className="btn-accent flex-1">
              {loading ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
