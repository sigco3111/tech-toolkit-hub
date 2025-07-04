// 어드민 인증 상태 전역 관리 Context
import React, { createContext, useContext, ReactNode } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

/**
 * 어드민 컨텍스트 타입 정의
 */
interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  adminLogin: (id: string, password: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
  clearError: () => void;
}

/**
 * 어드민 컨텍스트 생성
 */
const AdminContext = createContext<AdminContextType | undefined>(undefined);

/**
 * AdminProvider 컴포넌트 Props
 */
interface AdminProviderProps {
  children: ReactNode;
}

/**
 * 전역 어드민 인증 상태를 제공하는 Provider 컴포넌트
 * @param children 자식 컴포넌트들
 */
export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const adminData = useAdminAuth();

  return (
    <AdminContext.Provider value={adminData}>
      {children}
    </AdminContext.Provider>
  );
};

/**
 * AdminContext를 사용하는 커스텀 훅
 * @returns 어드민 인증 상태 및 관련 함수들
 */
export const useAdminContext = (): AdminContextType => {
  const context = useContext(AdminContext);
  
  if (context === undefined) {
    throw new Error('useAdminContext는 AdminProvider 내부에서만 사용할 수 있습니다.');
  }
  
  return context;
}; 