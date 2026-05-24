/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#FFFFFF',
          text: '#1E1E1E',
          border: '#EFEFEF',
          card: '#FFFFFF',
          'bg-dark': '#191919',
          'text-dark': '#F5F5F5',
          'border-dark': '#2E2E2E',
          'card-dark': '#202020',
          muted: '#6B6B6B',
          'muted-dark': '#9B9B9B',
          hover: 'rgba(0,0,0,0.05)',
          'hover-dark': 'rgba(255,255,255,0.05)',
        },
      },
      fontFamily: {
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'Helvetica', 'Arial', 'sans-serif',
        ],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'notion-hero': ['72px', '1.1'],
        'notion-h1': ['40px', '1.2'],
        'notion-h2': ['32px', '1.3'],
      },
      borderRadius: {},
      boxShadow: {
        'notion-card': '0px 4px 12px rgba(0,0,0,0.05)',
        'notion-card-hover': '0px 8px 24px rgba(0,0,0,0.08)',
        'notion-modal': '0px 4px 24px rgba(0,0,0,0.12)',
      },
      maxWidth: {
        'notion': '1200px',
      },
      spacing: {
        'notion-section': '120px',
      },
    },
  },
  plugins: [],
}
