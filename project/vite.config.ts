import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCt3tEVN2fXMAkx8qpX1nk9G2nugAumB28';
        return html.replace(/%VITE_GOOGLE_MAPS_API_KEY%/g, apiKey)
      }
    },
    {
      name: 'copy-netlify-files',
      writeBundle() {
        // Copy _redirects file
        const redirectsSource = resolve(__dirname, 'public/_redirects');
        const redirectsDest = resolve(__dirname, 'dist/_redirects');
        
        if (existsSync(redirectsSource)) {
          copyFileSync(redirectsSource, redirectsDest);
          console.log('✅ Copied _redirects to dist folder');
        }

        // Copy _headers file
        const headersSource = resolve(__dirname, 'public/_headers');
        const headersDest = resolve(__dirname, 'dist/_headers');
        
        if (existsSync(headersSource)) {
          copyFileSync(headersSource, headersDest);
          console.log('✅ Copied _headers to dist folder');
        }
      }
    }
  ],
  envPrefix: ['VITE_'],
  envDir: '.',
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react'],
          animations: ['gsap']
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@supabase/supabase-js', 'react', 'react-dom'],
  },
  esbuild: {
    target: 'es2020'
  }
});