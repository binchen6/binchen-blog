/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 墨卷 2.0 五级墨色 —— 引用 CSS 变量，暗色模式自动切换
        'ink': 'rgba(var(--ink-rgb), <alpha-value>)',
        'ink-2': 'rgba(var(--ink-2-rgb), <alpha-value>)',
        'ink-3': 'rgba(var(--ink-3-rgb), <alpha-value>)',
        'ink-4': 'rgba(var(--ink-4-rgb), <alpha-value>)',
        'ink-5': 'rgba(var(--ink-5-rgb), <alpha-value>)',
        'paper': 'rgba(var(--paper-rgb), <alpha-value>)',
        'paper-2': 'rgba(var(--paper-2-rgb), <alpha-value>)',
        'cinnabar': 'rgba(var(--cinnabar-rgb), <alpha-value>)',
        'dai': 'rgba(var(--dai-rgb), <alpha-value>)',
        'gold': 'rgba(var(--gold-rgb), <alpha-value>)',
        // 兼容 1.x 别名
        'ink-light': 'rgba(var(--ink-2-rgb), <alpha-value>)',
        'ink-muted': 'rgba(var(--ink-4-rgb), <alpha-value>)',
        'paper-warm': 'rgba(var(--paper-2-rgb), <alpha-value>)',
        'paper-cool': 'rgba(var(--paper-cool-rgb), <alpha-value>)',
        'cyan-dark': 'rgba(var(--dai-rgb), <alpha-value>)',
        'cyan-muted': 'rgba(var(--cyan-muted-rgb), <alpha-value>)',
        'bronze': 'rgba(var(--gold-rgb), <alpha-value>)',
        'bronze-light': 'rgba(var(--bronze-light-rgb), <alpha-value>)',
        'bronze-dark': 'rgba(var(--bronze-dark-rgb), <alpha-value>)',
        'cinnabar-dark': 'rgba(var(--cinnabar-dark-rgb), <alpha-value>)',
        'mist': 'rgba(var(--ink-5-rgb), <alpha-value>)',
        'mist-light': 'rgba(var(--mist-light-rgb), <alpha-value>)',
      },
      fontFamily: {
        // 系统字体栈：零网络下载，首屏秒开（CSP 也不允许外链字体）
        'serif-zh': ['"LXGW WenKai GB"', '"Songti SC"', '"STSong"', '"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', 'serif'],
        'sans-zh': ['-apple-system', '"PingFang SC"', '"Hiragino Sans GB"', '"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
        'mono-tech': ['"Maple Mono NF"', '"SF Mono"', '"JetBrains Mono"', '"Cascadia Code"', 'Consolas', '"Noto Sans SC"', 'monospace'],
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
