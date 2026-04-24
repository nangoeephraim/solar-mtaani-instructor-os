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
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          animation: ['framer-motion'],
          icons: ['lucide-react'],
          utils: ['clsx', 'date-fns'],
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          pdf: ['jspdf', 'jspdf-autotable', 'html2canvas'],
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
