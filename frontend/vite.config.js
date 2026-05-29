import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy optionnel — l'API est appelée directement sur http://127.0.0.1:8000
  },
})
