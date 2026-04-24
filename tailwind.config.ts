import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Structural colors — all theme-aware via CSS variables
        background:        "var(--bg-page)",
        sidebar:           "var(--bg-sidebar)",
        card:              "var(--bg-card)",
        "card-hover":      "var(--bg-hover)",
        input:             "var(--bg-input)",
        subtle:            "var(--bg-subtle)",
        border:            "var(--border)",
        "border-sub":      "var(--border-sub)",
        foreground:        "var(--text-1)",
        "foreground-2":    "var(--text-2)",
        muted:             "var(--text-4)",
        "muted-foreground":"var(--text-3)",
        // Semantic colors — constant regardless of theme
        accent:            "#0052FF",
        "accent-hover":    "#003fd6",
        "accent-muted":    "var(--primary-sub)",
        success:           "#10b981",
        "success-muted":   "rgba(16,185,129,0.12)",
        warning:           "#f59e0b",
        "warning-muted":   "rgba(245,158,11,0.12)",
        danger:            "#ef4444",
        "danger-muted":    "rgba(239,68,68,0.12)",
        purple:            "#7c3aed",
        "purple-muted":    "rgba(124,58,237,0.12)",
        orange:            "#f97316",
        "orange-muted":    "rgba(249,115,22,0.12)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
        border:  "var(--border)",
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        "fade-in":  "fadeIn 0.15s ease-out",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
