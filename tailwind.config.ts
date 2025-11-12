import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(50, 40%, 98%)", // jaune très clair (presque blanc sable)
        foreground: "hsl(140, 25%, 20%)", // vert profond pour contraste

        primary: {
          DEFAULT: "#0B8338", // vert doux
          foreground: "hsl(50, 40%, 98%)", // texte clair
        },
        secondary: {
          DEFAULT: "#FFEB00", // jaune pastel
          foreground: "hsl(140, 25%, 20%)",
        },
        accent: {
          DEFAULT: "hsl(140, 35%, 70%)", // vert menthe clair
          foreground: "hsl(140, 25%, 15%)",
        },
        muted: {
          DEFAULT: "hsl(50, 25%, 90%)", // jaune grisé
          foreground: "hsl(140, 10%, 35%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 70%, 50%)", // rouge classique si besoin
          foreground: "hsl(0, 0%, 98%)",
        },

        border: "hsl(140, 20%, 85%)",
        input: "hsl(50, 25%, 92%)",
        ring: "hsl(140, 40%, 50%)",

        card: {
          DEFAULT: "hsl(50, 40%, 97%)",
          foreground: "hsl(140, 25%, 20%)",
        },
        popover: {
          DEFAULT: "hsl(50, 40%, 97%)",
          foreground: "hsl(140, 25%, 20%)",
        },

        chart: {
          1: "hsl(140, 40%, 40%)", // vert
          2: "hsl(50, 80%, 55%)", // jaune doré
          3: "hsl(140, 30%, 55%)", // vert clair
          4: "hsl(50, 60%, 70%)", // jaune pâle
          5: "hsl(140, 20%, 25%)", // vert profond
        },

        sidebar: {
          DEFAULT: "hsl(140, 15%, 95%)",
          foreground: "hsl(140, 25%, 20%)",
          primary: "hsl(140, 40%, 40%)",
          "primary-foreground": "hsl(50, 40%, 98%)",
          accent: "hsl(50, 80%, 70%)",
          "accent-foreground": "hsl(140, 25%, 20%)",
          border: "hsl(140, 20%, 85%)",
          ring: "hsl(140, 40%, 45%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
