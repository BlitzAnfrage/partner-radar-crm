import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 48px rgba(15, 23, 42, 0.07)",
        premium: "0 1px 0 rgba(15, 23, 42, 0.04), 0 24px 70px rgba(15, 23, 42, 0.10)"
      },
      colors: {
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f7f8fa",
          subtle: "#f1f3f6"
        }
      }
    }
  },
  plugins: []
};

export default config;
