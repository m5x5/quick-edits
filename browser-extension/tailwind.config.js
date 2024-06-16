/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/core/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Menlo", "sans-serif"],
        sans: ["Helvetica", "sans-serif"],
      },
      fontSize: {
        xs: "0.8rem",
        sm: "0.9rem",
        md: "1rem",
        lg: "1.2rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
};
