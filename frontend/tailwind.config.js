/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lila: '#D8B4E2',
        'rosa-pastel': '#FFB7C5',
        'rosa-claro': '#FFB6C1',
        'rosa-soft': '#FFC0CB',
        'lavanda-blush': '#FFF0F5',
        fondo: '#F8F4FF',
        crema: '#FFF5EE',
        dorado: '#FFD700',
        'morado-oscuro': '#4A0E4E',
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      fontFamily: { script: ['Pacifico', 'cursive'], sans: ['Poppins', 'Nunito', 'Inter', 'sans-serif'] },
      boxShadow: { soft: '0 10px 30px rgba(216,180,226,0.3)', pink: '0 8px 32px rgba(255,183,197,0.35)' },
    },
  },
  plugins: [],
};
