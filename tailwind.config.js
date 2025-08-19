/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.hbs",
    "./dist/**/*.html", // Ensure this path is correct for generated HTML
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6', // Intense purple
        secondary: '#64748b', // Slate gray
        background: '#fdf2f8', // Very light pink
        border: '#f3e8ff', // Light purple border
        accent: '#ec4899', // Intense pink
        'surface': '#ffffff', // Pure white
        'text-primary': '#1e1b4b', // Dark purple
        'text-secondary': '#6b21a8', // Medium purple
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
    container: {
      center: true,
      padding: '1rem',
    },
  },
  plugins: [],
}
