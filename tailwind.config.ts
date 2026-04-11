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
        background: "#0d0f14",
        sidebar: "#111318",
        card: "#161820",
        "card-hover": "#1c1f2a",
        border: "#1e2028",
        accent: "#4361ee",
        "accent-hover": "#3451d1",
        "accent-muted": "rgba(67,97,238,0.12)",
        muted: "#6b7280",
        "muted-foreground": "#9ca3af",
        success: "#10b981",
        "success-muted": "rgba(16,185,129,0.12)",
        warning: "#f59e0b",
        "warning-muted": "rgba(245,158,11,0.12)",
        danger: "#ef4444",
        "danger-muted": "rgba(239,68,68,0.12)",
        purple: "#7c3aed",
        "purple-muted": "rgba(124,58,237,0.12)",
        orange: "#f97316",
        "orange-muted": "rgba(249,115,22,0.12)",
      },
      borderColor: {
        DEFAULT: "#1e2028",
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        "fade-in": "fadeIn 0.15s ease-out",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
