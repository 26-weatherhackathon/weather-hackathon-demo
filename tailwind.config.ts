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
        // 지형 고도 색상 (DESIGN.md 5.2.1)
        terrain: {
          mountain: "#8D6E4A",
          hill: "#A9C97E",
          plain: "#6FA96F",
          water: "#4A90D9",
        },
        // 안전 신호 색상 (DESIGN.md 5.2.1)
        signal: {
          safe: "#43A047",
          warn: "#FB8C00",
          danger: "#E53935",
        },
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.85)" },
        },
        pop: {
          "0%": { transform: "scale(0.7)" },
          "60%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 1.8s ease-in-out infinite",
        pop: "pop 0.4s cubic-bezier(0.3,1.6,0.5,1)",
      },
    },
  },
  plugins: [],
};

export default config;
