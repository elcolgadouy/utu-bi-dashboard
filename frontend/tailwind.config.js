/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        utu: {
          blue: '#1A4A7D', // UTU official style blue
          light: '#2E6BA8', // secondary blue
          accent: '#0C8EA1', // cian for accents
          success: '#10b981', // emerald
          warning: '#f59e0b', // amber
          danger: '#ef4444', 
        }
      },
      boxShadow: {
        'inst': '0 2px 10px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}
