/** Tailwind config for the AdversaryAI app (frontend/src → frontend/dist/app/assets).
 *  Theme colors are CSS variables (see src/app.css) so light/dark themes swap at runtime.
 */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./frontend/src/**/*.js"],
  theme: {
    extend: {
      colors: {
        white: v("tx-strong"),
        ink: { 950: v("ink-950"), 900: v("ink-900"), 800: v("ink-800"), 700: v("ink-700"), 600: v("ink-600") },
        accent: {
          100: v("accent-100"), 200: v("accent-200"), 300: v("accent-300"), 400: v("accent-400"),
          500: v("accent-500"), 600: v("accent-600"), 700: v("accent-700"),
        },
        slate: {
          100: v("slate-100"), 200: v("slate-200"), 300: v("slate-300"), 400: v("slate-400"),
          500: v("slate-500"), 600: v("slate-600"),
        },
        danger: { DEFAULT: "#ff5d6c", dim: "#8f2230" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["2.125rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-md": ["1.625rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-md": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
      },
      boxShadow: {
        glow: "0 0 0 2px rgba(255,46,63,0.25), 0 12px 36px -12px rgba(255,46,63,0.45)",
        lift: "0 2px 4px rgba(0,0,0,0.35), 0 16px 40px -16px rgba(0,0,0,0.7)",
        card: "0 1px 2px rgba(0,0,0,0.35), 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      transitionTimingFunction: { "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pop-in": { "0%": { opacity: "0", transform: "scale(0.96) translateY(6px)" }, "100%": { opacity: "1", transform: "scale(1) translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "fade-up": "fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pop-in": "pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
};
