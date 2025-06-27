/**
 * 성능 최적화를 위한 유틸리티 함수들
 * 디바운스, 스로틀, 메모이제이션 등의 기능을 제공합니다.
 */

import { useCallback, useRef, useMemo } from 'react';

/**
 * 디바운스 함수
 * 연속된 호출을 지연시켜 마지막 호출만 실행합니다.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 스로틀 함수
 * 지정된 시간 간격으로만 함수 실행을 허용합니다.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 디바운스 훅
 * React 컴포넌트에서 디바운스된 함수를 사용할 수 있습니다.
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    debounce((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay]
  );
}

/**
 * 스로틀 훅
 * React 컴포넌트에서 스로틀된 함수를 사용할 수 있습니다.
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    throttle((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay]
  );
}

/**
 * 안전한 JSON 파싱
 * JSON 파싱 실패 시 기본값을 반환합니다.
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * 로컬 스토리지 헬퍼
 * 타입 안전한 로컬 스토리지 접근을 제공합니다.
 */
export const localStorage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('로컬 스토리지 저장 실패:', error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('로컬 스토리지 삭제 실패:', error);
    }
  }
};

/**
 * 배열을 청크 단위로 분할합니다.
 * 대용량 데이터 처리 시 유용합니다.
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 이미지 지연 로딩을 위한 Intersection Observer 설정
 */
export function createLazyImageObserver(
  callback: (entry: IntersectionObserverEntry) => void
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback);
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  );
}

/**
 * 성능 측정 헬퍼
 * 함수 실행 시간을 측정합니다.
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  if (typeof window === 'undefined' || !window.performance) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

/**
 * 비동기 함수 성능 측정
 */
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  if (typeof window === 'undefined' || !window.performance) {
    return fn();
  }

  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

/**
 * 메모리 사용량 체크
 */
export function checkMemoryUsage(): void {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    console.warn('메모리 정보를 사용할 수 없습니다.');
    return;
  }

  const memory = (performance as any).memory;
  console.log('💾 메모리 사용량:', {
    used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
  });
} 