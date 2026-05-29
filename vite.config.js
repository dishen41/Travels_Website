import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        contact: resolve(__dirname, 'contact.html'),
        packages: resolve(__dirname, 'packages.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});
