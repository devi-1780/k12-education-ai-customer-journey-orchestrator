/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#80a8ff',
          400: '#4d7fff',
          500: '#2b5cf5',
          600: '#1e46cc',
          700: '#1936a3',
          800: '#162c80',
          900: '#132566',
        },
      },
    },
  },
  plugins: [],
};
