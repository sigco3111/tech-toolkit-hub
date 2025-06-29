// Firebase 북마크 관리 훅
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc, 
  deleteDoc,
  doc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseBookmark, FirestoreQueryResult } from '../../types';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * 현재 로그인한 사용자의 북마크를 관리하는 훅
 * @returns 북마크 목록, 로딩 상태, 에러, 북마크 추가/제거 함수
 */
export function useBookmarks(): FirestoreQueryResult<FirebaseBookmark> & {
  addBookmark: (toolId: string) => Promise<void>;
  removeBookmark: (toolId: string) => Promise<void>;
  isBookmarked: (toolId: string) => boolean;
  bookmarkedToolIds: string[];
  refreshBookmarks: () => Promise<void>;
} {
  const { user } = useAuthContext();
  const userId = user?.uid;
  
  const [data, setData] = useState<FirebaseBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자가 북마크한 도구 ID 목록
  const bookmarkedToolIds = useMemo(() => {
    const ids = data.map(bookmark => bookmark.toolId);
    console.log('🔖 useBookmarks: 북마크된 도구 ID 목록:', ids);
    return ids;
  }, [data]);

  // 북마크 쿼리 생성 함수 - 단순화된 쿼리 (인덱스 오류 방지)
  const createBookmarksQuery = useCallback(() => {
    if (!userId) return null;
    
    // 복합 인덱스(orderBy + where)를 사용하지 않고 단일 필드 인덱스만 사용
    return query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      firestoreLimit(100)
    );
  }, [userId]);

  // 일회성으로 북마크 데이터 가져오기
  const fetchBookmarksOnce = useCallback(async () => {
    if (!userId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔖 useBookmarks: 일회성 쿼리로 북마크 데이터 조회 시작 - 사용자 ID:', userId);
      
      const bookmarksQuery = createBookmarksQuery();
      if (!bookmarksQuery) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const snapshot = await getDocs(bookmarksQuery);
      console.log('📚 useBookmarks: 일회성 쿼리로 북마크 데이터 받음, 개수:', snapshot.size);
      
      const bookmarks: FirebaseBookmark[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookmarks.push({
          id: doc.id,
          toolId: data.toolId,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      // 최신 북마크가 앞에 오도록 클라이언트 측에서 정렬
      bookmarks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log('📚 useBookmarks: 일회성 쿼리로 받은 북마크 데이터:', bookmarks);
      setData(bookmarks);
      setIsLoading(false);
    } catch (error: any) {
      console.error('❌ 북마크 일회성 쿼리 실패:', error);
      setError(error.message || '북마크 목록을 불러오는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [userId, createBookmarksQuery]);

  // 북마크 목록 새로고침 함수 (외부에서 호출 가능)
  const refreshBookmarks = useCallback(async () => {
    console.log('🔄 북마크 목록 새로고침 시작');
    await fetchBookmarksOnce();
    console.log('🔄 북마크 목록 새로고침 완료');
  }, [fetchBookmarksOnce]);

  // 초기 데이터 로딩 및 실시간 구독 설정
  useEffect(() => {
    // 로그인한 사용자만 북마크 가져오기
    if (!userId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    // 먼저 일회성 쿼리로 데이터 가져오기
    fetchBookmarksOnce();
    
    // 실시간 구독 설정
    const bookmarksQuery = createBookmarksQuery();
    if (!bookmarksQuery) return;
    
    console.log('🔖 useBookmarks: 실시간 구독 설정 - 사용자 ID:', userId);
    
    const unsubscribe = onSnapshot(
      bookmarksQuery,
      (snapshot) => {
        console.log('📚 useBookmarks: 실시간 구독으로 북마크 데이터 받음, 개수:', snapshot.size);
        const bookmarks: FirebaseBookmark[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          bookmarks.push({
            id: doc.id,
            toolId: data.toolId,
            userId: data.userId,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });

        // 최신 북마크가 앞에 오도록 클라이언트 측에서 정렬
        bookmarks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log('📚 useBookmarks: 실시간 구독으로 받은 북마크 데이터:', bookmarks);
        setData(bookmarks);
        setIsLoading(false);
      },
      (error) => {
        console.error('❌ 북마크 실시간 구독 실패:', error);
        // 실시간 구독이 실패해도 일회성 쿼리 결과가 있으므로 에러 상태로 변경하지 않음
      }
    );

    return () => unsubscribe();
  }, [userId, createBookmarksQuery, fetchBookmarksOnce]);

  /**
   * 도구를 북마크에 추가
   * @param toolId 북마크할 도구 ID
   */
  const addBookmark = async (toolId: string): Promise<void> => {
    if (!userId) {
      throw new Error('로그인이 필요한 기능입니다.');
    }

    try {
      console.log('🔖 북마크 추가 시도:', toolId);
      
      // 중복 북마크 확인
      const existingQuery = query(
        collection(db, 'bookmarks'),
        where('userId', '==', userId),
        where('toolId', '==', toolId),
        firestoreLimit(1)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        console.log('⚠️ 이미 북마크에 추가된 도구입니다:', toolId);
        return;
      }

      const newBookmark = {
        userId,
        toolId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'bookmarks'), newBookmark);
      console.log('✅ 북마크 추가 완료:', toolId, '문서 ID:', docRef.id);
      
      // 즉시 상태 업데이트 (실시간 리스너가 업데이트되기 전에)
      const newBookmarkData: FirebaseBookmark = {
        id: docRef.id,
        toolId,
        userId,
        createdAt: new Date()
      };
      
      setData(prevData => [newBookmarkData, ...prevData]);
    } catch (error: any) {
      console.error('❌ 북마크 추가 실패:', error);
      throw new Error(error.message || '북마크 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 도구를 북마크에서 제거
   * @param toolId 북마크 해제할 도구 ID
   */
  const removeBookmark = async (toolId: string): Promise<void> => {
    if (!userId) {
      throw new Error('로그인이 필요한 기능입니다.');
    }

    try {
      console.log('🔖 북마크 제거 시도:', toolId);
      
      // 삭제할 북마크 문서 찾기
      const bookmarkQuery = query(
        collection(db, 'bookmarks'),
        where('userId', '==', userId),
        where('toolId', '==', toolId),
        firestoreLimit(1)
      );
      
      const bookmarkSnapshot = await getDocs(bookmarkQuery);
      
      if (bookmarkSnapshot.empty) {
        console.log('⚠️ 북마크에 없는 도구입니다:', toolId);
        return;
      }

      // 북마크 문서 삭제
      const bookmarkDoc = bookmarkSnapshot.docs[0];
      const bookmarkId = bookmarkDoc.id;
      await deleteDoc(doc(db, 'bookmarks', bookmarkId));
      console.log('✅ 북마크 제거 완료:', toolId, '문서 ID:', bookmarkId);
      
      // 즉시 상태 업데이트 (실시간 리스너가 업데이트되기 전에)
      setData(prevData => prevData.filter(bookmark => bookmark.toolId !== toolId));
    } catch (error: any) {
      console.error('❌ 북마크 제거 실패:', error);
      throw new Error(error.message || '북마크 제거 중 오류가 발생했습니다.');
    }
  };

  /**
   * 특정 도구가 북마크되어 있는지 확인
   * @param toolId 확인할 도구 ID
   * @returns 북마크 여부
   */
  const isBookmarked = (toolId: string): boolean => {
    const result = bookmarkedToolIds.includes(toolId);
    console.log(`🔍 도구 ${toolId} 북마크 여부 확인:`, result);
    return result;
  };

  return {
    data,
    isLoading,
    error,
    addBookmark,
    removeBookmark,
    isBookmarked,
    bookmarkedToolIds,
    refreshBookmarks
  };
}

/**
 * 특정 도구의 북마크 상태만 확인하는 가벼운 훅
 * @param toolId 확인할 도구 ID
 * @returns 북마크 여부, 로딩 상태, 에러
 */
export function useToolBookmarkStatus(toolId: string): {
  isBookmarked: boolean;
  isLoading: boolean;
  error: string | null;
  toggleBookmark: () => Promise<void>;
} {
  const { user } = useAuthContext();
  const userId = user?.uid;
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  // 북마크 상태 확인을 위한 일회성 쿼리
  const checkBookmarkStatus = useCallback(async () => {
    if (!userId || !toolId) {
      setIsBookmarked(false);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔍 useToolBookmarkStatus: 도구 ID ${toolId}의 북마크 상태 확인 시작`);
      
      const bookmarkQuery = query(
        collection(db, 'bookmarks'),
        where('userId', '==', userId),
        where('toolId', '==', toolId),
        firestoreLimit(1)
      );
      
      const snapshot = await getDocs(bookmarkQuery);
      const isMarked = !snapshot.empty;
      
      console.log(`🔍 도구 ID ${toolId}의 북마크 상태:`, isMarked ? '북마크됨' : '북마크되지 않음');
      
      setIsBookmarked(isMarked);
      
      if (isMarked) {
        setBookmarkId(snapshot.docs[0].id);
        console.log(`🔍 도구 ID ${toolId}의 북마크 문서 ID:`, snapshot.docs[0].id);
      } else {
        setBookmarkId(null);
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('❌ 북마크 상태 확인 실패:', error);
      setError(error.message || '북마크 상태를 확인하는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [userId, toolId]);

  // 초기 로딩 및 실시간 구독 설정
  useEffect(() => {
    // 로그인하지 않은 경우 또는 toolId가 없는 경우
    if (!userId || !toolId) {
      setIsBookmarked(false);
      setIsLoading(false);
      return;
    }

    // 먼저 일회성 쿼리로 상태 확인
    checkBookmarkStatus();
    
    // 실시간 구독 설정
    const bookmarkQuery = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      where('toolId', '==', toolId),
      firestoreLimit(1)
    );

    const unsubscribe = onSnapshot(
      bookmarkQuery,
      (snapshot) => {
        const isMarked = !snapshot.empty;
        console.log(`🔍 실시간 구독: 도구 ID ${toolId}의 북마크 상태:`, isMarked ? '북마크됨' : '북마크되지 않음');
        
        setIsBookmarked(isMarked);
        
        if (isMarked) {
          setBookmarkId(snapshot.docs[0].id);
        } else {
          setBookmarkId(null);
        }
        
        setIsLoading(false);
      },
      (error) => {
        console.error('❌ 북마크 상태 실시간 구독 실패:', error);
        // 실시간 구독이 실패해도 일회성 쿼리 결과가 있으므로 에러 상태로 변경하지 않음
      }
    );

    return () => unsubscribe();
  }, [userId, toolId, checkBookmarkStatus]);

  /**
   * 북마크 상태 토글 (추가/제거)
   */
  const toggleBookmark = async (): Promise<void> => {
    if (!userId) {
      throw new Error('로그인이 필요한 기능입니다.');
    }

    try {
      console.log(`🔄 도구 ID ${toolId}의 북마크 상태 토글 시도. 현재 상태:`, isBookmarked ? '북마크됨' : '북마크되지 않음');
      
      if (isBookmarked && bookmarkId) {
        // 북마크 제거
        await deleteDoc(doc(db, 'bookmarks', bookmarkId));
        console.log('✅ 북마크 제거 완료:', toolId);
        
        // 상태 즉시 업데이트
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        // 북마크 추가
        const newBookmark = {
          userId,
          toolId,
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'bookmarks'), newBookmark);
        console.log('✅ 북마크 추가 완료:', toolId);
        
        // 상태 즉시 업데이트
        setIsBookmarked(true);
        setBookmarkId(docRef.id);
      }
      
      // 북마크 상태 다시 확인
      await checkBookmarkStatus();
    } catch (error: any) {
      console.error('❌ 북마크 토글 실패:', error);
      throw new Error(error.message || '북마크 상태 변경 중 오류가 발생했습니다.');
    }
  };

  return {
    isBookmarked,
    isLoading,
    error,
    toggleBookmark
  };
} 