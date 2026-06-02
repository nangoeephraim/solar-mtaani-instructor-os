import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  // Esbuild minification — much less memory than terser (critical for OOM prevention)
  esbuild: {
    drop: ['debugger']
  },
  build: {
    emptyOutDir: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Removed manualChunks to resolve Node.js OOM crashes during Rollup graph optimization
      }
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'framer-motion', 'lucide-react', 'clsx', 'date-fns']
  }
});