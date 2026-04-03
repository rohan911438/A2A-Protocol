import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // We manually polyfill these in index.html to avoid proxy script corruption
      globals: false, 
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  define: {
    // Standard polyfill for libraries expecting Node globals
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
})
