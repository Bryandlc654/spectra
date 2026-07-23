/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f3f3',
          100: '#b3dbdb',
          200: '#80c3c3',
          300: '#4dabab',
          400: '#269797',
          500: '#006d70',
          600: '#005b5e',
          700: '#00494c',
          800: '#00373a',
          900: '#002528',
        },
      },
    },
  },
  plugins: [],
}
