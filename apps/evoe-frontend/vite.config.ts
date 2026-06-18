import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = !!process.env.VITE_API_URL || mode === 'production';
  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      host: true,
      allowedHosts: true,
      hmr: isProd ? false : {
        clientPort: 5174,
      },
      fs: {
        allow: ['../..']
      }
    },
  };
})

