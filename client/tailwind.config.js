/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        salon: {
          bg: '#1F2937',
          deep: '#111827',
          card: '#263345',
          cardHover: '#2E3D52',
          border: '#374151',
          gold: '#D4A017',
          goldHover: '#E5B32A',
          goldMuted: 'rgba(212, 160, 23, 0.14)',
          text: '#F9FAFB',
          textSecondary: '#D1D5DB',
          textMuted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        salon: '0 8px 24px -6px rgba(0, 0, 0, 0.35)',
        goldGlow: '0 0 0 1px rgba(212, 160, 23, 0.35), 0 10px 28px -8px rgba(212, 160, 23, 0.25)',
      },
      keyframes: {
        softPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.01)' },
        },
      },
      animation: {
        'soft-pulse': 'softPulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
