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
          900: "#030408", // Space black
          850: "#060914", // Deep navy
          800: "#0a0e1a",
          700: "#141b2d",
        },
        indigo: {
          500: "#6366f1", // Electric indigo
          600: "#4f46e5",
          400: "#818cf8",
        },
        purple: {
          500: "#a855f7", // Cyber purple
          600: "#9333ea",
          400: "#c084fc",
        },
        cyan: {
          400: "#22d3ee", // Stellar cyan
          500: "#06b6d4",
          300: "#67e8f9",
        },
        mist: "#f8fafc",
        slate: "#94a3b8",
        // Keep legacy names for easier migration
        aqua: "#22d3ee",
        blush: "#a855f7",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0, 0, 0, 0.5)",
        card: "0 10px 40px rgba(0, 0, 0, 0.4)",
        glow: "0 0 20px rgba(99, 102, 241, 0.3)",
        'cyan-glow': "0 0 20px rgba(34, 211, 238, 0.4)",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)",
        "stellar-mesh": "radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%)",
        "neural-gradient": "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        'pulse-glow': {
          "0%, 100%": { opacity: 0.5, filter: "brightness(100%)" },
          "50%": { opacity: 1, filter: "brightness(150%)" },
        },
        'neural-pulse': {
          "0%": { transform: "scale(0.95)", opacity: 0.3 },
          "50%": { transform: "scale(1)", opacity: 0.5 },
          "100%": { transform: "scale(0.95)", opacity: 0.3 },
        }
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        'pulse-glow': "pulse-glow 3s ease-in-out infinite",
        'neural-pulse': "neural-pulse 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
