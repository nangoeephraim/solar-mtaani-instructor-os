import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  // Esbuild minification options (for production builds)
  esbuild: {
    drop: ['console', 'debugger'] // Remove console.log and debugger in production
  },
  build: {
    // Use esbuild for minification (default, faster than terser)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          animation: ['framer-motion'],
          icons: ['lucide-react'],
          utils: ['clsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Disable source maps for smaller bundle
    sourcemap: false,
    // Asset optimization
    assetsInlineLimit: 4096 // Inline assets < 4kb
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'framer-motion', 'lucide-react', 'clsx']
  }
});
