/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["\"Space Grotesk\"", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "monospace"],
      },
      colors: {
        ink: {
          900: "#0a0b0f",
          800: "#12141c",
          700: "#1a1d29",
        },
        mist: "#f2f3f7",
        lime: "#c7ff5a",
        aqua: "#5ef0ff",
        blush: "#ff7ad9",
        slate: "#9aa3b2",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(9, 12, 26, 0.25)",
        card: "0 10px 30px rgba(10, 11, 15, 0.18)",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
        "hero-sheen": "linear-gradient(120deg, rgba(94, 240, 255, 0.18), rgba(255, 122, 217, 0.14), rgba(199, 255, 90, 0.16))",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.6s ease-out",
      },
    },
  },
  plugins: [],
}
