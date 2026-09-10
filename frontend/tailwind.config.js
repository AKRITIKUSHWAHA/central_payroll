/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cdNavy: {
          DEFAULT: '#12345b',
          dark: '#102f52',
          light: '#1f5f98',
          hover: '#1a416e',
        },
        cdBlue: {
          DEFAULT: '#2f6fb3',
          hover: '#245a96',
          light: '#eaf4fb',
          dark: '#273f9c',
        },
        cdSky: {
          DEFAULT: '#eaf4fb',
          light: '#f4f7fb',
          border: '#dde7f0',
        },
        cdGreen: {
          DEFAULT: '#0f766e',
          light: '#d4eee9',
          dark: '#145f57',
        },
        cdRed: {
          DEFAULT: '#a33b32',
          light: '#f7d8d5',
          dark: '#8d251d',
        },
        cdInk: '#1c2b3a',
        cdMuted: '#607286',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        cdCard: '0 4px 18px rgba(18, 52, 91, 0.06)',
        cdModal: '0 12px 36px rgba(18, 52, 91, 0.16)',
      }
    },
  },
  plugins: [],
}
