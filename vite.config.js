import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './main.js',
      }
    }
  },
  server: {
    host: '0.0.0.0'
  }
});