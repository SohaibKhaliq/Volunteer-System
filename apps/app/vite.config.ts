import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // proxy any /uploads requests to the API dev server so browsers can fetch files
    proxy: {
      '/uploads': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
