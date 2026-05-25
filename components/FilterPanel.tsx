'use client'

import { useState, useRef, useEffect } from 'react'
import { PLATFORMS, STATUSES } from '@/components/AddGameModal'

const STATUS_COLORS: Record<string, string> = {
  '100%': 'var(--status-done)',
  'En cours': 'var(--status-playing)',
  'Terminé': 'var(--status-finished)',
  'Abandonné': 'var(--status-dropped)',
  'À commencer': 'var(--status-backlog)',
}

export type SortOption = 'date_desc' | 'date_asc' | 'alpha_asc' | 'alpha_desc'

export interface Filters {
  statuses: string[]
  platforms: string[]
  sort: SortOption
  favoritesOnly: boolean
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  totalCount: number
  filteredCount: number
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date_desc', label: 'Date d\'ajout (récent)' },
  { value: 'date_asc', label: 'Date d\'ajout (ancien)' },
  { value: 'alpha_asc', label: 'A → Z' },
  { value: 'alpha_desc', label: 'Z → A' },
]

export default function FilterPanel({ filters, onChange, totalCount, filteredCount }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function toggleStatus(s: string) {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : [...filters.statuses, s]
    onChange({ ...filters, statuses: next })
  }

  function togglePlatform(p: string) {
    const next = filters.platforms.includes(p)
      ? filters.platforms.filter((x) => x !== p)
      : [...filters.platforms, p]
    onChange({ ...filters, platforms: next })
  }

  function reset() {
    onChange({ statuses: [], platforms: [], sort: 'date_desc', favoritesOnly: false })
  }

  const activeCount =
    filters.statuses.length +
    filters.platforms.length +
    (filters.favoritesOnly ? 1 : 0) +
    (filters.sort !== 'date_desc' ? 1 : 0)

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: open || activeCount > 0 ? 'var(--accent-dim)' : 'var(--bg-surface)',
          border: `1px solid ${open || activeCount > 0 ? 'var(--border-accent)' : 'var(--border)'}`,
          color: open || activeCount > 0 ? 'var(--accent-hover)' : 'var(--text-secondary)',
        }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Filtres
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            {activeCount}
          </span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Count badge next to button */}
      <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        {filteredCount}{filteredCount !== totalCount && `/${totalCount}`} jeu{filteredCount > 1 ? 'x' : ''}
      </span>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 rounded-2xl p-5 animate-fadeIn"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-accent)',
            width: 380,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Filtres & Tri
            </span>
            {activeCount > 0 && (
              <button onClick={reset} className="text-xs transition-colors hover:text-white"
                style={{ color: 'var(--accent-hover)' }}>
                Réinitialiser
              </button>
            )}
          </div>

          {/* Favoris */}
          <div className="mb-4">
            <button
              onClick={() => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                background: filters.favoritesOnly ? 'rgba(251,191,36,0.1)' : 'var(--bg-card)',
                border: `1px solid ${filters.favoritesOnly ? '#fbbf24' : 'var(--border)'}`,
                color: filters.favoritesOnly ? '#fbbf24' : 'var(--text-secondary)',
              }}>
              <span>★</span>
              <span>Favoris uniquement</span>
              {filters.favoritesOnly && <span className="ml-auto text-xs">✓</span>}
            </button>
          </div>

          {/* Statuts */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-muted)' }}>Statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const active = filters.statuses.includes(s.value)
                return (
                  <button key={s.value} onClick={() => toggleStatus(s.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: active ? STATUS_COLORS[s.value] + '22' : 'var(--bg-card)',
                      border: `1px solid ${active ? STATUS_COLORS[s.value] : 'var(--border)'}`,
                      color: active ? STATUS_COLORS[s.value] : 'var(--text-secondary)',
                    }}>
                    {active && <span className="text-xs">✓</span>}
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Plateformes */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-muted)' }}>Plateforme</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => {
                const active = filters.platforms.includes(p)
                return (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
                      border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`,
                      color: active ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    }}>
                    {active && '✓ '}{p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tri */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-muted)' }}>Trier par</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const active = filters.sort === opt.value
                return (
                  <button key={opt.value} onClick={() => onChange({ ...filters, sort: opt.value })}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all text-left"
                    style={{
                      background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
                      border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`,
                      color: active ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    }}>
                    {active && '✓ '}{opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
