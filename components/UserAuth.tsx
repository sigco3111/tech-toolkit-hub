// 사용자 인증 컴포넌트
import React, { useState } from 'react';
import { useAuthContext } from '../src/contexts/AuthContext';

/**
 * Google 소셜 로그인 및 사용자 프로필 표시 컴포넌트
 * 기존 RecommendationModal과 ToolCard의 스타일 패턴을 따름
 */
const UserAuth: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, signInWithGoogle, signOut, clearError } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * Google 로그인 버튼 클릭 핸들러
   */
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  /**
   * 로그아웃 버튼 클릭 핸들러
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  /**
   * 프로필 메뉴 토글
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  /**
   * 에러 메시지 표시 컴포넌트
   */
  const ErrorMessage = () => {
    if (!error) return null;
    
    return (
      <div className="absolute top-full right-0 mt-2 w-80 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
        <div className="flex justify-between items-start">
          <p className="text-sm">{error}</p>
          <button 
            onClick={clearError}
            className="text-red-500 hover:text-red-700 ml-2 font-bold"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 로그인하지 않은 상태
  if (!isAuthenticated) {
    return (
      <div className="relative">
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium text-slate-700">Google로 로그인</span>
        </button>
        <ErrorMessage />
      </div>
    );
  }

  // 로그인한 상태
  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center gap-3 px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:shadow-md transition-all duration-200"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || '사용자'}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <span className="text-slate-600 text-sm font-medium">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </span>
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-slate-700 truncate max-w-32">
            {user?.displayName || '사용자'}
          </p>
          <p className="text-xs text-slate-500 truncate max-w-32">
            {user?.email}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isMenuOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || '사용자'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center">
                  <span className="text-slate-600 text-lg font-medium">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {user?.displayName || '사용자'}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚪 로그아웃
            </button>
          </div>
        </div>
      )}

      {/* 메뉴가 열려있을 때 배경 클릭으로 닫기 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <ErrorMessage />
    </div>
  );
};

export default UserAuth; 