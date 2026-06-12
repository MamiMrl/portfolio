import { defineConfig } from 'vite'

// GitHub Pages serves this repo at /portfolio/. Override with VITE_BASE for other hosts.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/portfolio/',
})
