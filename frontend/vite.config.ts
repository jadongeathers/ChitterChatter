import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { UserConfig } from 'vite'

// Create a properly typed config object
const config: UserConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}

// Add development-specific configurations
if (process.env.NODE_ENV !== 'production') {
  try {
    console.log("In development mode")
    config.server = {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:5001", 
        },
      },
    }
    
    // Only add HTTPS configuration if certificate files exist
    const certPath = path.resolve(__dirname, 'certificates/localhost.pem')
    const keyPath = path.resolve(__dirname, 'certificates/localhost-key.pem')
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      config.server.https = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    }
  } catch (error) {
    console.warn('Unable to configure HTTPS for development server:', error)
  }
}

export default defineConfig(config)