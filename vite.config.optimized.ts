import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Optimized Vite configuration for better LCP
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize output
    target: 'es2015',
    minify: 'terser',
    
    // Code splitting for better LCP
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React vendor
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          
          // UI components
          'ui-vendor': [
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs'
          ],
          
          // Date utilities
          'date-vendor': [
            'date-fns',
            'date-fns-tz'
          ],
          
          // Charts and heavy components
          'charts': [
            'recharts'
          ],
          
          // API and state management
          'api-vendor': [
            'axios',
            '@tanstack/react-query'
          ]
        }
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Source maps for production debugging (optional)
    sourcemap: false
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios'
    ],
    exclude: [
      // Exclude large optional dependencies
    ]
  },
  
  // Server configuration
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  
  // Preview configuration
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
});
