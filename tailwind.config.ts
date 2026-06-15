import type { Config } from "tailwindcss";

// Mirrors the Prestige POS app design system (lib/design_system/colors.dart)
// so the website feels like a natural extension of the product.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#B7976E",
          deep: "#8E6E49",
          soft: "#EAD9C2",
          tint: "#F7EFE4",
        },
        ink: {
          DEFAULT: "#151515",
          muted: "#6B6B6B",
          subtle: "#A0A0A0",
        },
        surface: {
          1: "#FFFFFF",
          2: "#FAFAFA",
          3: "#F4F4F4",
        },
        hairline: "#E5E5E5",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(142,110,73,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
