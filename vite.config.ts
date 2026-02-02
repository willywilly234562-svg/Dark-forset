import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are loaded relatively, fixing path issues on GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});