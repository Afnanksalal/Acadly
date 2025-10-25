import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7c3aed", // violet-600
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#6d28d9",
          foreground: "#ffffff"
        },
        muted: {
          DEFAULT: "#1f1f2e",
          foreground: "#a1a1aa"
        },
        border: "#2e2e3e",
        input: "#2e2e3e",
        ring: "#8b5cf6"
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
}
export default config
