'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Profile {
  username: string
}

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single<Profile>()
      setUsername(data?.username ?? user.email?.split('@')[0] ?? null)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = [
    { href: '/library', label: 'Bibliothèque', icon: '◫' },
    { href: '/search', label: 'Rechercher', icon: '⌕' },
  ]

  return (
    <nav className="sticky top-0 z-40 border-b"
      style={{
        background: 'rgba(8,10,16,0.85)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--border)',
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/library" className="flex items-center gap-2.5 no-underline group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="rgba(123,47,255,0.2)" stroke="rgba(123,47,255,0.5)" strokeWidth="1"/>
            <path d="M6 12h3m0 0V9m0 3v3M15 9h3v3h-3v3h3" stroke="#7B2FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="1.2" fill="#a3e635"/>
          </svg>
          <span className="text-sm font-black tracking-widest text-white"
            style={{ fontFamily: 'var(--font-orbitron)' }}>
            GAMEVAULT
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                color: pathname === href ? 'var(--accent-hover)' : 'var(--text-secondary)',
                background: pathname === href ? 'var(--accent-dim)' : 'transparent',
              }}>
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          {username && (
            <Link href={`/profile/${username}`}
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'var(--text-secondary)' }}>
              @{username}
            </Link>
          )}
          <button onClick={handleSignOut} className="btn-ghost text-xs px-3 py-1.5">
            Déco
          </button>
        </div>
      </div>
    </nav>
  )
}
