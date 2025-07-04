// 어드민 인증 관리 훅
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 어드민 계정 정보 (실제 프로젝트에서는 환경 변수 사용 권장)
const ADMIN_ID = import.meta.env.VITE_ADMIN_ID || 'admin';
const ADMIN_PW = import.meta.env.VITE_ADMIN_PW || 'admin123';

/**
 * 어드민 인증 상태 관리 및 로그인/로그아웃 기능 제공
 * @returns 인증 상태, 로그인/로그아웃 함수, 로딩 상태
 */
export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 로컬 스토리지에서 어드민 세션 확인
  useEffect(() => {
    const checkAdminSession = () => {
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          if (session && session.isAdmin && session.expiresAt > Date.now()) {
            setIsAdmin(true);
          } else {
            // 세션이 만료된 경우 제거
            localStorage.removeItem('adminSession');
            setIsAdmin(false);
          }
        } catch (e) {
          localStorage.removeItem('adminSession');
          setIsAdmin(false);
        }
      }
      setIsLoading(false);
    };

    checkAdminSession();
  }, []);

  /**
   * 어드민 로그인 처리
   * @param id 어드민 아이디
   * @param password 어드민 비밀번호
   * @returns 로그인 성공 여부
   */
  const adminLogin = async (id: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // 어드민 인증 확인
      if (id === ADMIN_ID && password === ADMIN_PW) {
        // 어드민 세션 생성 (4시간 유효)
        const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
        localStorage.setItem('adminSession', JSON.stringify({
          isAdmin: true,
          expiresAt
        }));

        // 어드민 로그인 기록 저장 (선택적)
        try {
          const adminLogRef = doc(db, 'adminLogs', `login_${Date.now()}`);
          await setDoc(adminLogRef, {
            action: 'login',
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error('관리자 로그 기록 실패:', e);
          // 로그 기록 실패는 로그인 실패로 이어지지 않음
        }

        setIsAdmin(true);
        console.log('✅ 어드민 로그인 성공');
        return true;
      }

      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return false;
    } catch (error: any) {
      console.error('❌ 어드민 로그인 실패:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 어드민 로그아웃 처리
   */
  const adminLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 어드민 세션 제거
      localStorage.removeItem('adminSession');
      setIsAdmin(false);
      
      // 어드민 로그아웃 기록 저장 (선택적)
      try {
        const adminLogRef = doc(db, 'adminLogs', `logout_${Date.now()}`);
        await setDoc(adminLogRef, {
          action: 'logout',
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error('관리자 로그 기록 실패:', e);
        // 로그 기록 실패는 로그아웃 실패로 이어지지 않음
      }
      
      console.log('✅ 어드민 로그아웃 완료');
    } catch (error: any) {
      console.error('❌ 어드민 로그아웃 실패:', error);
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
    isAdmin,
    isLoading,
    error,
    adminLogin,
    adminLogout,
    clearError
  };
} 