import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: { DEFAULT: '#FFFFFF', foreground: '#0F172A' },
        primary: { DEFAULT: '#0284C7', light: '#0EA5E9', foreground: '#FFFFFF' },
        accent: { DEFAULT: '#059669', foreground: '#FFFFFF' },
        muted: { DEFAULT: '#F1F5F9', foreground: '#64748B' },
        border: '#E2E8F0',
        ring: '#0284C7',
        destructive: { DEFAULT: '#DC2626', foreground: '#FFFFFF' },
        warning: { DEFAULT: '#F59E0B', foreground: '#FFFFFF' },
        sidebar: { DEFAULT: '#0F172A', foreground: '#FFFFFF', muted: '#1E293B', accent: '#0284C7' },
      },
      borderRadius: {
        input: '4px',
        card: '8px',
        modal: '12px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        modal: '0 10px 25px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
