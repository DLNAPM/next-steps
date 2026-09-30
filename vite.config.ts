import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || (env.VITE_FIREBASE_PROJECT_ID ? `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      ...(apiKey ? { 'process.env.GEMINI_API_KEY': JSON.stringify(apiKey) } : {})
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: authDomain ? {
        '/__/auth': {
          target: `https://${authDomain}`,
          changeOrigin: true,
          secure: false,
        }
      } : undefined
    },
  };
});
