import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AuthForm from '@/components/AuthForm'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/library')

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}>

      {/* Ambient glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7B2FFF 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-8 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2FFFFF 0%, transparent 70%)', opacity: 0.05 }} />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              background: 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.1) + ')',
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + 's',
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="rgba(123,47,255,0.2)" stroke="rgba(123,47,255,0.5)" strokeWidth="1"/>
              <path d="M10 18h4m0 0v-4m0 4v4M22 14h4v4h-4v4h4" stroke="#7B2FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="18" r="2" fill="#a3e635"/>
            </svg>
            <h1 className="text-3xl font-black tracking-wider text-white glow-text"
              style={{ fontFamily: 'var(--font-orbitron)' }}>
              GAMEVAULT
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Ta bibliothèque de complétions avec tes potes
          </p>
        </div>

        <AuthForm />
      </div>

    </main>
  )
}
