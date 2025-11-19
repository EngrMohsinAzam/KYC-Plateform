import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
        animation: {
            'spin-slow': 'spin 8s linear infinite',
            'shimmer': 'shimmer 2s linear infinite',
          },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      colors: {
        primary: {
          DEFAULT: '#1A202C',
          dark: '#0F1419',
          light: '#2D3748',
        },
        secondary: {
          DEFAULT: '#4A5568',
          light: '#718096',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          light: '#F8F9FA',
          gray: '#F5F5F5',
        },
        accent: {
          pink: '#FCE7F3',
          'pink-dark': '#FBCFE8',
          blue: '#E6F3FF',
          green: '#10B981',
        },
        text: {
          primary: '#1A202C',
          secondary: '#6B7280',
          light: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'button': '9999px', // Fully rounded (pill shape)
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
export default config

