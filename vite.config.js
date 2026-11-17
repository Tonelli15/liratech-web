import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Porta 5173: é o endereço que a API autoriza em liratech.frontend.origem (CORS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
