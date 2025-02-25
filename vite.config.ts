import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remove comment once we connect our frontend to our backend
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:4002', // Updated to match the exposed port
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
    watch: {
      usePolling: true
    }
  }
});
