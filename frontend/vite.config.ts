import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    // La web se publica en https://lemichiw-cyber.github.io/si-ventas-/
    base: env.VITE_BASE || '/',
  };
});
