import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('./admin', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist-admin', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
})
