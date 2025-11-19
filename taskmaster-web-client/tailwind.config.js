/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'], // Support both class and data-theme if needed, but we are moving to data-theme for palettes
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans, Satoshi)", "Inter", "Roboto", "sans-serif"],
      },
      colors: {
        background: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        'border-color': 'var(--border)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        // Mapping standard names to new variables for compatibility
        foreground: 'var(--text-primary)',
        'muted-foreground': 'var(--text-secondary)',
        card: 'var(--bg-surface)',
        'card-foreground': 'var(--text-primary)',
        popover: 'var(--bg-surface)',
        'popover-foreground': 'var(--text-primary)',
        secondary: 'var(--bg-surface)', // Using surface as secondary for now
        'secondary-foreground': 'var(--text-primary)',
        muted: 'var(--bg-surface)',
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--primary)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid-24': '24px 24px',
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
