import type { Config } from "tailwindcss";

// Premium dark theme: deep navy canvas, emerald→cyan brand gradient ("the edge / money / go"),
// layered glass surfaces. Inspired by dimers, Linear, and Stripe.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05080f",
          900: "#080c17",
          850: "#0b1120",
          800: "#0f1729",
          700: "#16203a",
          600: "#1f2c4d",
        },
        brand: {
          DEFAULT: "#10b981",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        ice: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
        pos: "#34d399",
        neg: "#fb7185",
        warn: "#fbbf24",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "ui-sans-serif", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #34d399 0%, #06b6d4 100%)",
        "brand-radial": "radial-gradient(60% 60% at 50% 0%, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0) 70%)",
        "mesh":
          "radial-gradient(40% 50% at 15% 10%, rgba(16,185,129,0.16) 0%, transparent 60%)," +
          "radial-gradient(45% 55% at 85% 0%, rgba(6,182,212,0.14) 0%, transparent 55%)," +
          "radial-gradient(50% 60% at 50% 100%, rgba(99,102,241,0.10) 0%, transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(16,185,129,0.25), 0 8px 40px -8px rgba(16,185,129,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
        lift: "0 24px 64px -24px rgba(0,0,0,0.75)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s infinite",
        float: "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
