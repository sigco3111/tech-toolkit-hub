// Firebase 인증 상태 관리 훅
import { useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { FirebaseUser } from '../../types';

/**
 * Firebase Authentication 상태 관리 및 Google 소셜 로그인 기능 제공
 * @returns 인증 상태, 로그인/로그아웃 함수, 로딩 상태
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Firebase 인증 상태 변화 감지
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Google 소셜 로그인 처리
   * 로그인 성공 시 사용자 정보를 Firestore에 저장
   */
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 사용자 정보를 Firestore에 저장 (기존 문서가 있으면 업데이트)
      const userDoc: Omit<FirebaseUser, 'uid'> = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userDoc,
        createdAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Google 로그인 성공:', user.displayName);
      
    } catch (error: any) {
      console.error('❌ Google 로그인 실패:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그아웃 처리
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await firebaseSignOut(auth);
      console.log('✅ 로그아웃 완료');
      
    } catch (error: any) {
      console.error('❌ 로그아웃 실패:', error);
      setError(error.message || '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 에러 상태 초기화
   */
  const clearError = () => {
    setError(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
    clearError
  };
} 