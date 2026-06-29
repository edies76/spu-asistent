import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta suave, coherente con "tarjetas con bordes redondeados y sombras suaves".
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b6cdff",
          300: "#84aaff",
          400: "#5285ff",
          500: "#2f63f5",
          600: "#1f49d6",
          700: "#1a3aab",
          800: "#193286",
          900: "#182d6b",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(31, 73, 214, 0.18)",
        card: "0 2px 12px -4px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        fadein: {
          "0%": { opacity: "0", filter: "blur(6px)" },
          "100%": { opacity: "1", filter: "blur(0px)" },
        },
        scanline: {
          "0%": { top: "0%" },
          "50%": { top: "100%" },
          "100%": { top: "0%" },
        },
      },
      animation: {
        fadein: "fadein 0.28s ease-out",
        scanline: "scanline 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
