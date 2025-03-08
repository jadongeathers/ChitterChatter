import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certificates/localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certificates/localhost.pem')),
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000", 
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
