/** @type {import('tailwindcss').Config} */

// Todas as cores apontam para variáveis CSS definidas em src/index.css.
// Isso permite o tema claro/escuro (automático ou forçado) sem duplicar classes.
const cssVar = (name) => `var(--${name})`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: cssVar("bg"),
        surface: cssVar("surface"),
        surface2: cssVar("surface2"),
        ink: cssVar("ink"),
        ink2: cssVar("ink2"),
        muted: cssVar("muted"),
        line: cssVar("line"),
        line2: cssVar("line2"),
        grid: cssVar("grid"),
        accent: cssVar("accent"),
        accentHover: cssVar("accentHover"),
        accentSoft: cssVar("accentSoft"),
        accentInk: cssVar("accentInk"),
        onAccent: cssVar("onAccent"),
        series1: cssVar("series1"),
        good: cssVar("good"),
        goodSoft: cssVar("goodSoft"),
        goodInk: cssVar("goodInk"),
        warnSoft: cssVar("warnSoft"),
        warnInk: cssVar("warnInk"),
        serious: cssVar("serious"),
        seriousSoft: cssVar("seriousSoft"),
        seriousInk: cssVar("seriousInk"),
        crit: cssVar("crit"),
        critSoft: cssVar("critSoft"),
        critInk: cssVar("critInk"),
        scrim: cssVar("scrim"),
      },
    },
    fontFamily: {
      sans: ["IBM Plex Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
    },
  },
  plugins: [],
};
