/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8"
        }
      },
      borderRadius: {
        ds: "0.5rem",
        "ds-lg": "0.75rem"
      },
      boxShadow: {
        ds: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "ds-md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "ds-lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
      },
      fontSize: {
        "ds-page-title": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "ds-section": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }]
      }
    }
  },
  plugins: []
};
