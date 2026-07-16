/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0E14',
        panel: '#12161F',
        panel2: '#181D29',
        line: '#242B3A',
        signal: '#00D9C0',
        signal2: '#00A8FF',
        warn: '#FF6B4A',
        mist: '#8B93A7',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

