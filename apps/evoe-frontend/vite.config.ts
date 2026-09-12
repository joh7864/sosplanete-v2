import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // isProd doit se baser uniquement sur le mode Node, pas sur la présence de VITE_API_URL
  // (VITE_API_URL peut être défini en local pour pointer vers une IP LAN)
  const isProd = mode === 'production';
  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'react/jsx-dev-runtime',
        'axios',
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        '@react-three/postprocessing',
        'framer-motion',
        'lucide-react',
        'react-youtube',
        'socket.io-client',
      ],
    },
    server: {
      port: 5174,
      strictPort: true,
      host: true,
      allowedHosts: true,
      hmr: isProd ? false : (env.VITE_HMR_SECURE === 'true' ? {
        clientPort: 443,
        protocol: 'wss',
      } : true),
      fs: {
        allow: ['../..']
      },
      proxy: {
        '/uploads': {
          target: env.VITE_API_URL || 'http://localhost:3011',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three') || id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
                return 'vendor-three';
              }
              if (id.includes('@react-three/postprocessing') || id.includes('postprocessing')) {
                return 'vendor-postprocessing';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react') || id.includes('react-icons')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('axios') || id.includes('socket.io-client')) {
                return 'vendor-core';
              }
            }
          },
        },
      },
    },
  };
})


