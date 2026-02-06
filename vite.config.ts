import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    // Load các biến môi trường
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // KHẮC PHỤC LỖI TRẮNG MÀN HÌNH TẠI ĐÂY
      define: {
        // Định nghĩa process.env để tránh lỗi "process is not defined"
        'process.env': {},
        // Gán giá trị API Key cụ thể
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      }
    };
});
