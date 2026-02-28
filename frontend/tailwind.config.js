/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        // ConnectHub brand
        accent: {
          DEFAULT: '#7c5cfc',
          2: '#fc5c7d',
          3: '#3de8b0',
        },
        surface: {
          DEFAULT: '#10101a',
          2: '#181828',
          3: '#1f1f35',
        },
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
}
