/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        hud: '0 18px 60px rgba(0, 0, 0, 0.32)',
      },
      colors: {
        tunnel: {
          950: '#02050c',
          900: '#07111d',
          800: '#112030',
        },
      },
    },
  },
  plugins: [],
};
