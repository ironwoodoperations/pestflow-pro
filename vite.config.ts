import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/_admin/' : '/',
  server: { port: 8080 },
  build: {
    outDir: 'public/_admin',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
  },
}))
