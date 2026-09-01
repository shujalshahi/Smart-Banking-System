import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This tells Vite to expose your app to your local Wi-Fi network
    port: 5173  // This locks down the port so it stays on 5173
  }
})