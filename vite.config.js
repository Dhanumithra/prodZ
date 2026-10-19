import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/*.docx', '**/~$*', '**/*.tmp', '**/mso*', '**/.git/**'],
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});

