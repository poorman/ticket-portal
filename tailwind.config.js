/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crane: {
          DEFAULT: '#d4a574',
          dark: '#b8935f',
          light: '#e8c49f',
          lighter: '#f5e6d3',
        },
        status: {
          open: '#ef4444',
          'in-progress': '#f59e0b',
          waiting: '#3b82f6',
          resolved: '#10b981',
          closed: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
