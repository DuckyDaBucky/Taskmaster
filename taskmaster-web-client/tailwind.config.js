/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Enables class-based dark mode (uses `dark:` variants)
  theme: {
    extend: {
      fontFamily: {
        // Define fonts using CSS variables or keep specific definitions
        sans: ["var(--font-sans, Satoshi)", "Inter", "Roboto", "sans-serif"],
        roboto: ["Roboto", "sans-serif"], // Keep roboto if used elsewhere
        ptsans: ["PT Sans", "sans-serif"], // Keep PT Sans if used elsewhere
      },
      colors: {
        // Define colors using CSS variables for theme switching
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Keep specific px values if needed, but prefer variables
        'xl': '0.75rem',
        '2xl': '1.0rem',
        '3xl': '1.5rem',
        '4xl': '2.0rem',
        'full': '9999px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)', // Use CSS variable for soft shadow
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        fadeIn: {
          "0%": {
            opacity: 0,
          },
          "100%": {
            opacity: 1,
          },
        }
      },
      animation: {
        blob: "blob 7s infinite",
        "animation-delay-2000": "blob 7s infinite 2s",
        "animation-delay-4000": "blob 7s infinite 4s",
      },
      fadeIn: 'fadeIn 0.5s ease-in-out',
    },
  },
  plugins: [],
};
