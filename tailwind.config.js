import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './views/**/*.{ts,tsx,js,jsx}',
    './context/**/*.{ts,tsx,js,jsx}',
    './hooks/**/*.{ts,tsx,js,jsx}',
    './ai/**/*.{ts,tsx,js,jsx}',
    './utils/**/*.{ts,tsx,js,jsx}',
    './export/**/*.{ts,tsx,js,jsx}',
    './api/**/*.{ts,tsx,js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          'surface-2': 'var(--surface-2)',
          border: 'var(--border)',
          'border-strong': 'var(--border-strong)',
          text: 'var(--text)',
          'text-strong': 'var(--text-strong)',
          'text-muted': 'var(--text-muted)',
          input: 'var(--input-bg)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
        },
      },
    },
  },
  plugins: [animate],
};
