/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tealcustom: '#114b5f',
        dog: '#c6abd8',
        cat: '#f4d06f',
        bird: '#4fb3b0',
        other: '#e9a89b',
      },

      borderRadius: {
        blob: '60% 40% 50% 50% / 60% 50% 50% 40%',
      },

      transform: {
        dog: 'rotate(-5deg)',
        cat: 'rotate(5deg)',
        bird: 'rotate(-10deg)',
        other: 'rotate(8deg)',
      },

    },
  },
  plugins: [],
}
