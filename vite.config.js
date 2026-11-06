import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" gera caminhos relativos: o build funciona em qualquer subpasta
// (GitHub Pages em https://usuario.github.io/repositorio/, servidor interno, file:// via preview, etc.).
// O app usa roteamento por hash (#hoje, #concursos...), então não precisa de rewrite no servidor.
export default defineConfig({
  base: process.env.VITE_BASE || "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
