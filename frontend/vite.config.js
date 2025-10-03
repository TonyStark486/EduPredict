import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/", // Vercel serves from root
  plugins: [react()],
})
