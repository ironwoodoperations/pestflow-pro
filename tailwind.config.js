export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        oswald: ['"Oswald"', 'sans-serif'],
        raleway: ['"Raleway"', 'sans-serif'],
        'space-grotesk': ['"Space Grotesk"', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
      },
      colors: {
        primary: 'hsl(28, 100%, 50%)',
        secondary: 'hsl(45, 95%, 52%)',
      }
    }
  },
  plugins: []
}
