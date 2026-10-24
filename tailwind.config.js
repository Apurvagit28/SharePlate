/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcf8',
          100: '#faf8f0',
          200: '#f5f0e0',
          300: '#efe8d4',
        },
        sage: {
          50: '#f4f7f3',
          100: '#e3ebe1',
          200: '#c7d6c4',
          300: '#a3bba0',
          400: '#7e9b7a',
          500: '#5e7c5a',
          600: '#4a6347',
          700: '#3b5039',
          800: '#304030',
          900: '#273328',
        },
        forest: {
          50: '#eef5ee',
          100: '#d6e8d6',
          200: '#aed0ae',
          300: '#7eb07e',
          400: '#508c50',
          500: '#2e6e2e',
          600: '#1f5a23',
          700: '#1a471d',
          800: '#163a18',
          900: '#102e12',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(16, 46, 18, 0.06), 0 1px 2px rgba(16, 46, 18, 0.04)',
        'card-hover': '0 12px 32px rgba(16, 46, 18, 0.10), 0 4px 8px rgba(16, 46, 18, 0.06)',
        'soft': '0 2px 12px rgba(16, 46, 18, 0.06)',
        'glow': '0 0 40px rgba(46, 110, 46, 0.15)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
