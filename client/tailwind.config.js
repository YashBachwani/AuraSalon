/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        salon: {
          // Backward-compatible core tokens for tests and existing shells
          bg: '#171717',
          dark: '#1F2937',
          deep: '#111827',
          card: '#202020',
          cardHover: '#282828',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(212, 175, 112, 0.15)',
          gold: '#D4AF70',
          goldClassic: '#D4A017',
          goldHover: '#E2C288',
          goldMuted: 'rgba(212, 175, 112, 0.12)',
          text: '#F7F3EC',
          textSecondary: '#D1CDCA',
          textMuted: '#A5A19A',
          // Luxury palette tokens
          charcoal: '#171717',
          secondary: '#242424',
          ivory: '#F7F3EC',
          beige: '#E9DFD0',
          champagne: '#D4AF70',
          // Stage 3 Warm Luxury Palette Tokens
          warmBg: '#191817',
          warmCard: '#292622',
          antiqueGold: '#C89B45',
          champagneGold: '#E8C982',
          warmIvory: '#F5EFE4',
          softBeige: '#D9D0C2',
          bronze: '#9B7650',
          warmMuted: '#A8A096',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        salon: '0 12px 32px -8px rgba(0, 0, 0, 0.45)',
        salonElevated: '0 20px 48px -12px rgba(0, 0, 0, 0.65)',
        goldGlow: '0 0 0 1px rgba(212, 175, 112, 0.35), 0 12px 32px -8px rgba(212, 175, 112, 0.25)',
        goldSubtle: '0 0 0 1px rgba(212, 175, 112, 0.2), 0 8px 20px -6px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        softPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.01)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'soft-pulse': 'softPulse 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
