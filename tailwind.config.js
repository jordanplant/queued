/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/(auth)/**/*.{js,jsx,ts,tsx}",
    "./app/(tabs)/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        text: "var(--text)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        border: "var(--border)",
        parks: {
          // Walt Disney World
          "magic-kingdom": "#3B82F6",
          epcot: "#A855F7",
          "hollywood-studios": "#F59E0B",
          "animal-kingdom": "#22C55E",
          // Disneyland
          "disneyland-park": "#EF4444",
          "california-adventure": "#F97316",
          // Disneyland Paris
          "disneyland-paris": "#EC4899",
          "disney-adventure-world": "#14B8A6",
          // Tokyo Disney
          "tokyo-disneyland": "#F43F5E",
          "tokyo-disneysea": "#0EA5E9",
          // Hong Kong & Shanghai
          "hong-kong-disneyland": "#FF6B6B",
          "shanghai-disneyland": "#EAB308",
          // Universal Orlando
          "universal-studios-florida": "#DC2626",
          "islands-of-adventure": "#06B6D4",
          "epic-universe": "#7C3AED",
          // Universal Hollywood
          "universal-studios-hollywood": "#EA580C",
          // Universal Japan
          "universal-studios-japan": "#2563EB",
          // Universal Singapore
          "universal-studios-singapore": "#CA8A04",
          // Universal Beijing
          "universal-studios-beijing": "#059669",
        },
      },
    },
  },
  plugins: [],
};
