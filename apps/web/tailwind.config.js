/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        forge: '0 30px 100px rgba(0,0,0,.42)',
        glass: 'inset 0 1px 0 rgba(255,255,255,.07), 0 24px 70px rgba(0,0,0,.32)',
      },
      backgroundImage: {
        'forge-grid': 'linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(1deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '.65' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        float: 'float 9s ease-in-out infinite',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite',
        scan: 'scan 4s linear infinite',
      },
    },
  },
  plugins: [],
};
