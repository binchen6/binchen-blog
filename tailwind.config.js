/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ink-black': '#1a1a1a',
        'ink-light': '#4a4a4a',
        'paper': '#f5f0e8',
        'paper-warm': '#ebe5d9',
        'paper-cool': '#e8e4dc',
        'cinnabar': '#c9372c',
        'cinnabar-dark': '#a52a20',
        'indigo-ink': '#2c3e50',
        'bronze': '#8b6914',
        'bronze-light': '#a67c00',
        'stone': '#8c8c8c',
        'stone-light': '#b5b5b5',
        'mist': '#d4cfc7',
      },
      fontFamily: {
        'serif-zh': ['"Noto Serif SC"', '"Songti SC"', 'serif'],
        'sans-zh': ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
        'mono-zh': ['"Noto Serif SC"', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'ink-spread': 'inkSpread 3s ease-out forwards',
        'fade-in': 'fadeIn 1.2s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
