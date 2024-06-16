import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // grid
      gridTemplateColumns: {
        full: "repeat(14, 1fr)",
        "1-2": "1fr 2fr",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-dark":
          "linear-gradient(-180deg, black, rgba(0,0,0,0.9) 50%, transparent 100%)",
        "gradient-light":
          "linear-gradient(180deg, rgba(255,255,255,1), transparent 400%)",
      },
      colors: {
        // white: "#e5e5e5",
        white: "#fff",
        "dark-900": "#000",
        "dark-800": "#070707",
        "dark-700": "#222",
      },
    },
  },
  plugins: [],
};
export default config;
