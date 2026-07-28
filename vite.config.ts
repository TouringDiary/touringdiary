import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const tunnelHmr =
    (env.DEV_HMR_TUNNEL || process.env.DEV_HMR_TUNNEL || '') === '1'

  return {
    server: {
      port: 5200,
      strictPort: true,
      host: true,

      allowedHosts: ['.trycloudflare.com'],

      // Local (default): no override → Vite HMR on the dev server port (ws).
      // Tunnel (DEV_HMR_TUNNEL=1): HMR via wss on public port 443.
      ...(tunnelHmr
        ? {
            hmr: {
              protocol: 'wss' as const,
              clientPort: 443,
            },
          }
        : {}),

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
