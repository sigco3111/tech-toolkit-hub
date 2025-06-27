// 토스트 메시지 관리 훅
import { useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../components/Toast';

/**
 * 토스트 메시지를 관리하는 커스텀 훅
 * 성공, 에러, 정보 메시지를 쉽게 표시할 수 있는 기능을 제공합니다.
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * 새로운 토스트 메시지를 추가
   */
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  /**
   * 토스트 메시지를 제거
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * 모든 토스트 메시지를 제거
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * 성공 메시지 표시
   */
  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    return addToast({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [addToast]);

  /**
   * 에러 메시지 표시
   */
  const showError = useCallback((title: string, message?: string, duration?: number) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: duration || 6000, // 에러 메시지는 더 오래 표시
    });
  }, [addToast]);

  /**
   * 정보 메시지 표시
   */
  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return addToast({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showInfo,
  };
} 