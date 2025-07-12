/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4B89DC",
        secondary: "#5D9CEC",
        background: "#F7F9FC",
        text: "#333333",
        lightText: "#7F8C8D",
        error: "#FF5A5F",
        warning: "#FFAB40",
        success: "#50C878",
        danger: "#FF5A5F",
        border: "#E1E8ED",
        card: "#FFFFFF",
        input: "#F8F9FA",
      },
    },
  },
  plugins: [],
};
