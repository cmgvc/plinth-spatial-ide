/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: "#0a0a0a",
          sidebar: "#111111",
          hover: "#2a2d2e",
          active: "#007acc",
          border: "#222222",
          text: {
            primary: "#cccccc",
            secondary: "#858585",
            muted: "#555555",
          },
        },
      },
      fontSize: {
        "xs-code": "11px",
        "sm-code": "13px",
      },
      letterSpacing: {
        tightest: "-.075em",
        widest: ".2em",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
