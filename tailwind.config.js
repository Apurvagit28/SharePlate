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
        },
      },
    },
  },
  plugins: [],
};
