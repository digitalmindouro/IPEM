import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta IPEM / Ordenismo
        ink:     '#1a1713',
        paper:   '#f5f0e8',
        warm:    '#c8a96e',
        gold:    '#d4a843',
        'gold-light': '#e8c96a',
        accent:  '#8b3a2a',
        muted:   '#7a7060',
        light:   '#ede8dc',
        border:  '#d4cdbf',
        // Escuros para dashboard
        'dark-1': '#0f0e0b',
        'dark-2': '#1a1713',
        'dark-3': '#252219',
        'dark-4': '#2e2820',
        'dark-5': '#3a3228',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c8a96e 0%, #d4a843 50%, #e8c96a 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1a1713 0%, #252219 100%)',
        'subtle-texture': `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,169,110,0.03) 60px, rgba(200,169,110,0.03) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(200,169,110,0.03) 60px, rgba(200,169,110,0.03) 61px)`,
      },
      boxShadow: {
        'gold': '0 0 0 1px rgba(212,168,67,0.3)',
        'gold-glow': '0 0 20px rgba(212,168,67,0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}

export default config
