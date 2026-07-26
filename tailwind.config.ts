import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0C0E",
        surface: "#131417",
        edge: "#26282E",
        cream: "#ECE7DF",
        muted: "#9A968E",
        accent: { DEFAULT: "#22D3EE", soft: "#67E8F9", dim: "#0E7490" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        hero: ["clamp(2.6rem,7vw,5.2rem)", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
        section: ["clamp(1.8rem,3.5vw,2.75rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.25), 0 8px 40px -12px rgba(34,211,238,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -30px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
};
export default config;
