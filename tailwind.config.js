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
        // 墨卷 2.0 五级墨色
        'ink': '#16130e',
        'ink-2': '#3d3629',
        'ink-3': '#6b6252',
        'ink-4': '#8a8580',
        'ink-5': '#cfc8b8',
        'paper': '#f7f3ea',
        'paper-2': '#efe9db',
        'cinnabar': '#b3352b',
        'dai': '#2f4a4a',
        'gold': '#b8933f',
        // 兼容 1.x 别名
        'ink-light': '#3d3629',
        'ink-muted': '#8a8580',
        'paper-warm': '#efe9db',
        'paper-cool': '#e5e0d8',
        'cyan-dark': '#2f4a4a',
        'cyan-muted': '#2a5a5a',
        'bronze': '#b8933f',
        'bronze-light': '#e8d5a3',
        'bronze-dark': '#8a6a2a',
        'cinnabar-dark': '#9a2a20',
        'mist': '#cfc8b8',
        'mist-light': '#e8e4dc',
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
