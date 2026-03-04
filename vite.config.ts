import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
  // Esbuild minification options (for production builds)
  esbuild: {
    drop: ['debugger']
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          animation: ['framer-motion'],
          icons: ['lucide-react'],
          utils: ['clsx', 'date-fns']
        }
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
