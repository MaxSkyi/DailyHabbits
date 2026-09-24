/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B0C10",
          card: "#16181F",
          cardHover: "#1C1F28",
          surface: "#1A1D26",
          border: "rgba(255, 255, 255, 0.07)",
          borderLight: "rgba(255, 255, 255, 0.12)",
        },
        heatmap: {
          0: "#1A1D24",
          1: "#0E4429",
          2: "#006D32",
          3: "#26A641",
          4: "#39D353",
        },
        brand: {
          emerald: "#10B981",
          cyan: "#06B6D4",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          amber: "#F59E0B",
          rose: "#F43F5E",
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(16, 185, 129, 0.15)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "scale-tap": "scaleTap 0.15s ease-in-out",
        "pulse-subtle": "pulseSubtle 2s infinite ease-in-out",
      },
      keyframes: {
        scaleTap: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.92)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        }
      }
    },
  },
  plugins: [],
}
