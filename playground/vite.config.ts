import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@enfyra/sdk-react': resolve(__dirname, '../dist/index.mjs'),
      '@enfyra/sdk-core': resolve(__dirname, '../../core/dist/index.mjs'),
    },
  },
  server: {
    port: 3001,
    open: true,
  },
})
