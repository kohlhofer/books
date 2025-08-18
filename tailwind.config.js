/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.{html,js,hbs}",
    "./dist/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        secondary: '#6c757d',
        background: '#f8f9fa',
        surface: '#ffffff',
        border: '#dee2e6',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
      },
      spacing: {
        '0.75': '0.75rem',
      },
    },
  },
  plugins: [],
}
