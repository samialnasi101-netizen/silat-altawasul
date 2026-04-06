import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: "hsl(var(--accent))",
        "glass-border": "var(--glass-border)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        "text-primary": "var(--text-primary-color)",
        "text-secondary": "var(--text-secondary-color)",
        "text-muted": "var(--text-muted-color)",
      },
      fontFamily: {
        sans: ["Segoe UI", "Tajawal", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px",
        strong: "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out both",
        "slide-up": "slideUp 0.5s ease-out both",
        "slide-down": "slideDown 0.4s ease-out both",
        "scale-in": "scaleIn 0.3s ease-out both",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "count-up": "fadeIn 0.6s ease-out both",
        "border-glow": "borderGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideDown: { "0%": { opacity: "0", transform: "translateY(-10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        glowPulse: { "0%, 100%": { opacity: "0.4" }, "50%": { opacity: "0.8" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(52, 211, 153, 0.2)" },
          "50%": { borderColor: "rgba(52, 211, 153, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
