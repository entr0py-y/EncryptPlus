import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.85rem", { lineHeight: "1.25rem" }], // 13.6px (was 12px)
        sm: ["0.975rem", { lineHeight: "1.45rem" }], // 15.6px (was 14px)
        base: ["1.125rem", { lineHeight: "1.65rem" }], // 18px (was 16px)
        lg: ["1.25rem", { lineHeight: "1.8rem" }], // 20px (was 18px)
        xl: ["1.4rem", { lineHeight: "1.9rem" }], // 22.4px (was 20px)
        "2xl": ["1.75rem", { lineHeight: "2.15rem" }], // 28px (was 24px)
        "3xl": ["2.15rem", { lineHeight: "2.45rem" }], // 34.4px (was 30px)
        "4xl": ["2.6rem", { lineHeight: "2.85rem" }], // 41.6px (was 36px)
        "5xl": ["3.45rem", { lineHeight: "1" }], // 55.2px (was 48px)
        "6xl": ["4.25rem", { lineHeight: "1" }], // 68px (was 60px)
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"SF Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
