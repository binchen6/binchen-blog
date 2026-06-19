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
        // 国风古代科技风 - 核心配色
        'ink': '#0d0d0d',
        'ink-light': '#4a4a4a',
        'ink-muted': '#8c8c8c',
        'paper': '#f8f5f0',
        'paper-warm': '#ede8e0',
        'paper-cool': '#e5e0d8',
        'cyan-dark': '#1a3a3a',
        'cyan-muted': '#2a5a5a',
        'bronze': '#c9a84c',
        'bronze-light': '#e8d5a3',
        'bronze-dark': '#8a6a2a',
        'cinnabar': '#c23a30',
        'cinnabar-dark': '#9a2a20',
        'mist': '#d4cfc7',
        'mist-light': '#e8e4dc',
      },
      fontFamily: {
        'serif-zh': ['"Noto Serif SC"', '"Source Han Serif SC"', '"Songti SC"', 'serif'],
        'sans-zh': ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        'mono-tech': ['"JetBrains Mono"', '"Noto Sans SC"', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'ink-spread': 'inkSpread 3s ease-out forwards',
        'fade-in': 'fadeIn 1.2s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'rotate-slow': 'rotateSlow 120s linear infinite',
        'rotate-medium': 'rotateSlow 60s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'pulse-bronze': 'pulseBronze 4s ease-in-out infinite',
        'star-twinkle': 'starTwinkle 2s ease-in-out infinite',
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
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 20px rgba(26, 58, 58, 0.2)' },
          '50%': { opacity: '1', boxShadow: '0 0 40px rgba(26, 58, 58, 0.4)' },
        },
        pulseBronze: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        starTwinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'paper-texture': "url('/paper-texture.png')",
        'star-grid': "url('/star-grid.svg')",
        'gradient-ink': 'linear-gradient(135deg, #0d0d0d 0%, #1a3a3a 100%)',
        'gradient-bronze': 'linear-gradient(135deg, #c9a84c 0%, #e8d5a3 50%, #c9a84c 100%)',
        'gradient-paper': 'linear-gradient(135deg, #f8f5f0 0%, #ede8e0 100%)',
      },
    },
  },
  plugins: [],
}
