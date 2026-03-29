export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { bangers: ['"Bangers"', 'cursive'] },
      colors: {
        primary: 'hsl(28, 100%, 50%)',
        secondary: 'hsl(45, 95%, 52%)',
      }
    }
  },
  plugins: []
}
