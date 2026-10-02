/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#d9e6ff', 200: '#bcd3ff', 300: '#8eb4ff',
          400: '#598bff', 500: '#3366ff', 600: '#1f47f5', 700: '#1836e1',
          800: '#1a2fb6', 900: '#1b2d8f', 950: '#141d57',
        },
        ink: { DEFAULT: '#0f172a', soft: '#475569' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 3px rgba(15,23,42,.08), 0 1px 2px rgba(15,23,42,.04)' },
    },
  },
  plugins: [],
};
