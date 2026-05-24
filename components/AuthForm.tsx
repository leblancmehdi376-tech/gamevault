'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Mode = 'login' | 'signup'

export default function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim().toLowerCase() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setSuccess('Vérifie ta boîte mail pour confirmer ton compte !')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        router.push('/library')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(translateError(message))
    } finally {
      setLoading(false)
    }
  }

  function translateError(msg: string): string {
    if (msg.includes('Failed to fetch') || msg.includes('fetch'))
      return '❌ Impossible de joindre Supabase. Vérifie : (1) ton projet Supabase n\'est pas en pause sur supabase.com, (2) que le .env.local est bien chargé (relance npm run dev après toute modif).'
    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
    if (msg.includes('User already registered')) return 'Cet email est déjà utilisé.'
    if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.'
    if (msg.includes('Unable to validate email')) return 'Adresse email invalide.'
    if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
    return msg
  }

  return (
    <div className="glass-card rounded-2xl p-8"
      style={{ border: '1px solid rgba(123,47,255,0.2)' }}>

      {/* Tab toggle */}
      <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--bg-surface)' }}>
        {(['login', 'signup'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-secondary)',
              boxShadow: mode === m ? '0 2px 10px rgba(123,47,255,0.4)' : 'none',
            }}>
            {m === 'login' ? 'Connexion' : 'Inscription'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'var(--text-secondary)' }}>
              Pseudo
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ton_pseudo_gaming"
              className="input-base"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_-]+"
              title="Lettres, chiffres, _ et - uniquement"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.fr"
            className="input-base"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-secondary)' }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-base"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm animate-fadeIn"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg px-4 py-3 text-sm animate-fadeIn"
            style={{ background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.3)', color: '#a3e635' }}>
            {success}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-accent mt-2 w-full text-sm font-bold tracking-wide"
          style={{ fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em' }}>
          {loading
            ? 'Chargement...'
            : mode === 'login' ? 'CONNEXION' : 'CRÉER MON COMPTE'
          }
        </button>
      </form>

      {mode === 'signup' && (
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          Un email de confirmation sera envoyé à ton adresse.
        </p>
      )}
    </div>
  )
}
