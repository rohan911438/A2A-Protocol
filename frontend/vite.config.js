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
  build: {
    // Split the heavy third-party code out of the app bundle: the Stellar
    // SDK alone is ~1MB, so it (and framer-motion, and the React runtime)
    // each get their own long-cached chunk instead of one monolith that
    // has to re-download whenever any app code changes. This takes the app
    // entry chunk from ~1.5MB to ~85KB. The Stellar SDK chunk is
    // irreducibly ~985KB (one package, needed for signing/submitting), so
    // the warning limit is set just above it rather than pretending it can
    // shrink.
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@stellar') || id.includes('stellar-sdk') || id.includes('stellar-base')) return 'stellar'
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
          if (
            id.includes('react-router') ||
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor'
          }
          return 'vendor'
        },
      },
    },
  },
})
