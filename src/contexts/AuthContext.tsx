// 인증 상태 전역 관리 Context
import React, { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

/**
 * 인증 컨텍스트 타입 정의
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * 인증 컨텍스트 생성
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider 컴포넌트 Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 전역 인증 상태를 제공하는 Provider 컴포넌트
 * @param children 자식 컴포넌트들
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authData = useAuth();

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * AuthContext를 사용하는 커스텀 훅
 * @returns 인증 상태 및 관련 함수들
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  
  return context;
}; 