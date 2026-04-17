/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0078D4',
          light: '#429CE3',
          dark: '#106EBE'
        }
      }
    }
  },
  plugins: []
}
