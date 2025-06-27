// Firebase 설정 및 초기화
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 설정 객체 - 환경 변수에서 로드 (임시로 직접 설정)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDJHTEDMRpusZJ5RYdaUFiAAw8vpVtM4I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tech-toolkit-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tech-toolkit-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tech-toolkit-hub.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "21955518269",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:21955518269:web:737034cd18894d6682ef54"
};

// Firebase 앱 초기화
export const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(app);

// Firebase Authentication 인스턴스
export const auth = getAuth(app);

// Firebase 설정 유효성 검사
export const isFirebaseConfigured = () => {
  const isConfigured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
  
  // 디버깅용 로그 (개발 환경에서만) - 한 번만 출력
  if (import.meta.env.DEV && !(window as any).firebaseLogShown) {
    console.log('🔥 Firebase 설정 상태:', {
      isConfigured,
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasApiKey: !!firebaseConfig.apiKey
    });
    (window as any).firebaseLogShown = true;
  }
  
  return isConfigured;
}; 