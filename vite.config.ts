import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // process.env.API_KEY를 코드에서 사용할 수 있도록 주입
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});