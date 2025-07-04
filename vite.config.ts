import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // 모든 환경 변수 로드 (VITE_ 접두사가 없는 변수도 포함)
    const env = loadEnv(mode, process.cwd(), ['VITE_', '']);
    
    return {
      // 환경 변수를 클라이언트 코드에서 사용할 수 있도록 정의
      define: {
        // Gemini API 키
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        
        // Firebase 설정
        'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY),
        'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN),
        'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID),
        'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET),
        'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID),
        'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID),
        
        // 관리자 계정 설정
        'process.env.VITE_ADMIN_ID': JSON.stringify(env.VITE_ADMIN_ID),
        'process.env.VITE_ADMIN_PW': JSON.stringify(env.VITE_ADMIN_PW)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Vercel 배포를 위한 빌드 설정
      build: {
        outDir: 'dist',
        sourcemap: true,
        // 빌드 실패 시 에러 표시
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000
      }
    };
});
