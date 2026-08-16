/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F3E8FF',
          100: '#E0C7FF',
          200: '#C78FFF',
          300: '#A85CFF',
          400: '#8B3AFF',
          500: '#7B2CFF',
          600: '#6A1FDF',
          700: '#5515B8',
          800: '#3F0E8F',
          900: '#2A0866',
        },
        'accent-cyan': '#00D4FF',
        'accent-pink': '#FF2BD6',
        'success': '#00FF88',
        'warning': '#FFD600',
        'error': '#FF4D4D',
        bg: {
          base: '#070B1A',
          card: 'rgba(255, 255, 255, 0.06)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E2E8F0',
          tertiary: '#AAB7C4',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glow-strong': '0 0 16px rgba(123, 44, 255, 0.7), 0 0 32px rgba(123, 44, 255, 0.3)',
        'glow-medium': '0 0 10px rgba(123, 44, 255, 0.5), 0 0 20px rgba(0, 212, 255, 0.2)',
        'glow-weak': '0 0 6px rgba(123, 44, 255, 0.4)',
        'glow-success': '0 0 8px rgba(0, 255, 136, 0.3)',
        'glow-warning': '0 0 8px rgba(255, 214, 0, 0.3)',
        'glow-error': '0 0 8px rgba(255, 77, 77, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in': 'fadeInUp 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'breathe': 'breathe 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(123, 44, 255, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(123, 44, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.3)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
      },
    },
  },
  plugins: [],
}