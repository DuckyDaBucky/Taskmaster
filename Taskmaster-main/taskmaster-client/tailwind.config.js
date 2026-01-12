/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/client-pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/services/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/utils/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/index.css",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans, Satoshi)", "Inter", "Roboto", "sans-serif"],
      },
      colors: {
        background: "var(--bg-app)",
        surface: "var(--bg-surface)",
        "border-color": "var(--border)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        foreground: "var(--text-primary)",
        "muted-foreground": "var(--text-secondary)",
        card: "var(--bg-surface)",
        "card-foreground": "var(--text-primary)",
        popover: "var(--bg-surface)",
        "popover-foreground": "var(--text-primary)",
        secondary: "var(--bg-surface)",
        "secondary-foreground": "var(--text-primary)",
        muted: "var(--bg-surface)",
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--primary)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-24": "24px 24px",
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
