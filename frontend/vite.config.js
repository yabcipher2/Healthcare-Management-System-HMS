import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = (env.VITE_API_URL || '').trim();

  // VITE_* values are baked into the bundle at build time. A production build
  // without VITE_API_URL ships an app that calls http://localhost:5000, which
  // fails on a deployed site — say so loudly instead of failing silently.
  if (command === 'build' && !apiUrl) {
    console.warn(
      '\n⚠  VITE_API_URL is empty for this build: the bundle will call http://localhost:5000.' +
      '\n   Set VITE_API_URL (e.g. https://hms-backend.onrender.com) before building for production.\n'
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
  };
})
