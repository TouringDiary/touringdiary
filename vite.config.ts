import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '')

  return {
    server: {
      port: 5200,
      strictPort: true,
      host: true,

      allowedHosts: ['.trycloudflare.com'],

      // Phone reaches the app via HTTPS tunnel; HMR must use the public origin
      // (WSS:443), not localhost — otherwise the client flaps on the device.
      // Note: Vite still full-reloads after a backgrounded-tab WS drop (no public
      // API to suppress that). Camera capture stays in-page (getUserMedia) so the
      // tab is not backgrounded for "Scatta foto".
      hmr: {
        protocol: 'wss',
        clientPort: 443,
      },

      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },

    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        include: ['buffer', 'stream', 'util'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react-pdf': ['@react-pdf/renderer'],
          },
        },
      },
    },
  }
})
