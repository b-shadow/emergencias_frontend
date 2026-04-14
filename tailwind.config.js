/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#9c27b0', // Purple (Material Design)
        accent: '#ff1493',  // Deep Pink
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#f44336',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
