/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#001F3F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FFDC00",
          foreground: "#001F3F",
        },
        background: {
          DEFAULT: "#F8F9FA",
          dark: "#111111",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1A1A1A",
        },
        border: {
          DEFAULT: "#001F3F",
          subtle: "#AAAAAA",
        },
        error: {
          DEFAULT: "#85144b",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#2ECC40",
          foreground: "#000000",
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        bold: 700,
        black: 900,
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px rgba(0,31,63,1)',
        'hard-hover': '6px 6px 0px 0px rgba(0,31,63,1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};