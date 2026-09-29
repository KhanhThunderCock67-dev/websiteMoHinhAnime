/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          950: '#06090e',
          900: '#0a0f18',
          850: '#0e1524',
          800: '#141e33',
          700: '#1e2c4a',
          600: '#2b3f68',
        },
        warhammer: {
          imperium: '#f59e0b',
          chaos: '#e11d48',
          xenos: '#10b981',
        },
        anime: {
          accent: '#ec4899',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
