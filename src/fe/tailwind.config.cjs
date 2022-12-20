/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
    daisyui: {
      themes: [
        {
          mytheme: {
           "primary": "#14B8A6",
           "primary-content": "#FFFFFF",
           "secondary": "#F000B8",
           "accent": "#37CDBE",
           "neutral": "#3D4451",
           "base-100": "#FFFFFF",
           "base-200": "#F1F5F9",
           "base-300": "#E2E8F0",
           "info": "#3ABFF8",
           "success": "#36D399",
           "warning": "#FBBD23",
           "error": "#F87272",
          },
        },
      ],
    },
    plugins: [
    require("daisyui")
  ],
}
