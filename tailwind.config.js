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
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        macos: {
          blue: '#007AFF',
          gray: '#8E8E93',
          red: '#FF3B30',
          green: '#34C759',
          orange: '#FF9500',
        },
      },
      borderRadius: {
        'mac': '12px',
        'mac-lg': '16px',
        'mac-xl': '24px',
      },
      boxShadow: {
        'mac': '0 4px 24px rgba(0, 0, 0, 0.04)',
        'mac-hover': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}


