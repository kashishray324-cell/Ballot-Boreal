import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  publicDir: 'contracts/artifacts',
  build: {
    target: 'esnext',
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: {
      output: {
        manualChunks: (id) => id.includes('onchain-runtime-v3') ? 'midnight-wasm' : undefined,
      },
    },
  },
  plugins: [
    react(),
    wasm(),
    nodePolyfills({ include: ['buffer', 'process', 'util'] }),
  ],
  optimizeDeps: {
    include: ['@midnight-ntwrk/compact-runtime'],
    exclude: ['@midnight-ntwrk/onchain-runtime-v3'],
  },
  resolve: {
    alias: {
      'isomorphic-ws': fileURLToPath(new URL('./src/lib/isomorphic-ws-browser.ts', import.meta.url)),
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }
})
