import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#080a10',
          surface: '#0f111a',
          card: '#14162000',
          hover: '#1c1e2c',
        },
        accent: {
          DEFAULT: '#7B2FFF',
          hover: '#9B5FFF',
          dim: 'rgba(123,47,255,0.15)',
        },
        status: {
          done: '#a3e635',
          playing: '#f59e0b',
          finished: '#60a5fa',
          dropped: '#f87171',
          backlog: '#94a3b8',
        },
      },
      fontFamily: {
        display: ['var(--font-orbitron)', 'sans-serif'],
        body: ['var(--font-outfit)', 'sans-serif'],
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        glow: { '0%,100%': { boxShadow: '0 0 8px rgba(123,47,255,0.4)' }, '50%': { boxShadow: '0 0 20px rgba(123,47,255,0.8)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        glow: 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
