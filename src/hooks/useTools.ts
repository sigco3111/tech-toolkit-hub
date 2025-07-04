// Firebase 도구 목록 관리 훅
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  addDoc, 
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QueryConstraint,
  getDocs,
  Query,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseTool, ToolInput, FirestoreQueryResult, SortOption } from '../../types';
// CATEGORIES 상수 가져오기 제거

/**
 * Firebase에서 도구 목록을 실시간으로 가져오고 관리하는 훅
 * @param category 필터링할 카테고리 (선택사항)
 * @param sortOrder 정렬 옵션
 * @returns 도구 목록, 로딩 상태, 에러, 도구 추가 함수
 */
export function useTools(category?: string, sortOrder: SortOption = 'updated_desc'): FirestoreQueryResult<FirebaseTool> & {
  addTool: (toolData: ToolInput, userId: string) => Promise<void>;
  updateTool: (toolId: string, toolData: ToolInput, userId: string) => Promise<void>;
  deleteTool: (toolId: string, userId: string) => Promise<void>;
  categories: string[];
} {
  const [data, setData] = useState<FirebaseTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<string[]>(['전체']);

  // 카테고리 목록 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        
        const categoryNames: string[] = [];
        categoriesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.name) {
            categoryNames.push(data.name);
          }
        });
        
        // 카테고리 이름 오름차순으로 정렬
        categoryNames.sort((a, b) => a.localeCompare(b));
        
        // '전체' 카테고리를 맨 앞에 추가
        setCategoryList(['전체', ...categoryNames]);
      } catch (error) {
        console.error('카테고리 목록 로드 오류:', error);
      }
    };
    
    loadCategories();
  }, []);

  // 카테고리 및 정렬 옵션 변경 시 데이터 로드
  useEffect(() => {
    // 이전 구독 취소를 위한 변수
    let unsubscribe: (() => void) | undefined;
    
    // 데이터 로드 함수
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        console.log('🔍 useTools: Firebase 데이터 조회 시작', { category, sortOrder });

        // 기본 쿼리 - 인덱스 문제를 방지하기 위해 단순하게 구성
        let toolsQuery: Query<DocumentData>;
        
        // 에러 방지를 위해 try-catch 블록으로 쿼리 생성 과정 감싸기
        try {
          // 인덱스 오류를 방지하기 위한 임시 해결책
          // 카테고리 필터링이 있는 경우에도 정렬을 적용하지 않고 기본 쿼리만 사용
          if (category && category !== '전체') {
            console.log('📂 카테고리 필터 적용 (인덱스 오류 방지 모드):', category);
            
            // 카테고리로만 필터링하는 단순 쿼리 사용
            toolsQuery = query(
              collection(db, 'tools'),
              where('category', '==', category)
            );
          } else {
            // 카테고리 필터링이 없는 경우
            console.log('📂 전체 카테고리 조회');
            
            // 정렬 옵션만 적용
            switch (sortOrder) {
              case 'rating_desc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('averageRating', 'desc')
                );
                break;
              case 'rating_asc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('averageRating', 'asc')
                );
                break;
              case 'name_asc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('name', 'asc')
                );
                break;
              case 'name_desc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('name', 'desc')
                );
                break;
              case 'created_desc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('createdAt', 'desc')
                );
                break;
              case 'created_asc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('createdAt', 'asc')
                );
                break;
              case 'updated_desc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('updatedAt', 'desc')
                );
                break;
              case 'updated_asc':
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('updatedAt', 'asc')
                );
                break;
              default:
                // 기본값: 업데이트 날짜 내림차순
                toolsQuery = query(
                  collection(db, 'tools'),
                  orderBy('updatedAt', 'desc')
                );
            }
          }

          // 실시간 구독 설정
          try {
            console.log('🔄 실시간 구독 설정 시도');
            
            unsubscribe = onSnapshot(
              toolsQuery,
              (snapshot) => {
                console.log('📊 useTools: Firebase 응답 받음, 문서 수:', snapshot.size);
                const tools: FirebaseTool[] = [];
                
                snapshot.forEach((doc) => {
                  const data = doc.data();
                  tools.push({
                    id: doc.id,
                    name: data.name,
                    category: data.category,
                    url: data.url,
                    description: data.description,
                    memo: data.memo,
                    plan: data.plan,
                    averageRating: data.averageRating || 0,
                    ratingCount: data.ratingCount || 0,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    createdBy: data.createdBy
                  });
                });
                
                // 카테고리 필터링인 경우 클라이언트 측에서 정렬 적용
                if (category && category !== '전체') {
                  console.log('📊 클라이언트 측에서 정렬 적용:', sortOrder);
                  tools.sort((a, b) => {
                    switch (sortOrder) {
                      case 'rating_desc':
                        return b.averageRating - a.averageRating;
                      case 'rating_asc':
                        return a.averageRating - b.averageRating;
                      case 'name_asc':
                        return a.name.localeCompare(b.name);
                      case 'name_desc':
                        return b.name.localeCompare(a.name);
                      case 'created_desc':
                        return b.createdAt.getTime() - a.createdAt.getTime();
                      case 'created_asc':
                        return a.createdAt.getTime() - b.createdAt.getTime();
                      case 'updated_desc':
                        return b.updatedAt.getTime() - a.updatedAt.getTime();
                      case 'updated_asc':
                        return a.updatedAt.getTime() - b.updatedAt.getTime();
                      default:
                        return b.updatedAt.getTime() - a.updatedAt.getTime();
                    }
                  });
                }
                
                setData(tools);
                setIsLoading(false);
                setError(null);
              },
              (error) => {
                console.error('❌ 실시간 구독 실패:', error);
                
                // 실시간 구독이 실패하면 일회성 쿼리로 폴백
                console.log('🔄 일회성 쿼리로 폴백');
                fetchDataOnce(toolsQuery);
              }
            );
          } catch (error: any) {
            console.error('❌ 실시간 구독 설정 실패:', error);
            
            // 실시간 구독 설정이 실패하면 일회성 쿼리로 폴백
            console.log('🔄 일회성 쿼리로 폴백');
            fetchDataOnce(toolsQuery);
          }
          
        } catch (error: any) {
          // 쿼리 생성 과정에서 오류 발생 시
          console.error('❌ 쿼리 생성 실패:', error);
          // 기본 쿼리로 폴백 (인덱스 없이도 작동하는 가장 기본적인 쿼리)
          console.log('🔄 가장 기본적인 쿼리로 폴백');
          
          toolsQuery = query(
            collection(db, 'tools')
          );
          
          // 폴백 쿼리로 데이터 조회
          fetchDataOnce(toolsQuery);
        }
        
      } catch (error: any) {
        console.error('❌ 도구 목록 쿼리 설정 실패:', error);
        setError('도구 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
        setIsLoading(false);
        
        // 에러 발생 시에도 이전 데이터 유지
        if (data.length === 0) {
          setData([]);
        }
      }
    };
    
    // 일회성 쿼리로 데이터 가져오기
    const fetchDataOnce = async (toolsQuery: Query<DocumentData>) => {
      try {
        console.log('📥 일회성 쿼리 실행');
        const snapshot = await getDocs(toolsQuery);
        
        console.log('📊 일회성 쿼리 응답 받음, 문서 수:', snapshot.size);
        const tools: FirebaseTool[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          tools.push({
            id: doc.id,
            name: data.name,
            category: data.category,
            url: data.url,
            description: data.description,
            memo: data.memo,
            plan: data.plan,
            averageRating: data.averageRating || 0,
            ratingCount: data.ratingCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            createdBy: data.createdBy
          });
        });
        
        setData(tools);
        setIsLoading(false);
        setError(null);
      } catch (error: any) {
        console.error('❌ 일회성 쿼리 실패:', error);
        // 에러가 발생해도 이전 데이터를 유지하고 로딩 상태만 종료
        setError(`데이터 로딩 중 오류가 발생했습니다. (${error.message || '알 수 없는 오류'})`);
        setIsLoading(false);
        
        // 에러가 발생했지만 이전 데이터를 계속 보여주기 위해 data 상태를 비우지 않음
        // 기존 데이터가 없을 경우에만 빈 배열 설정
        if (data.length === 0) {
          setData([]);
        }
      }
    };
    
    // 데이터 로드 시작
    loadData();
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (unsubscribe) {
        console.log('🔄 Firebase 구독 해제');
        unsubscribe();
      }
    };
  }, [category, sortOrder]);

  /**
   * 새로운 도구를 Firestore에 추가
   * @param toolData 추가할 도구 정보
   * @param userId 도구를 추가하는 사용자 ID
   */
  const addTool = async (toolData: ToolInput, userId: string): Promise<void> => {
    try {
      const newTool = {
        ...toolData,
        averageRating: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId
      };

      await addDoc(collection(db, 'tools'), newTool);
      console.log('✅ 새 도구 추가 완료:', toolData.name);
      
    } catch (error: any) {
      console.error('❌ 도구 추가 실패:', error);
      throw new Error(error.message || '도구 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 기존 도구를 Firestore에서 수정
   * @param toolId 수정할 도구 ID
   * @param toolData 수정할 도구 정보
   * @param userId 도구를 수정하는 사용자 ID
   */
  const updateTool = async (toolId: string, toolData: ToolInput, userId: string): Promise<void> => {
    try {
      // 도구 문서 참조
      const toolRef = doc(db, 'tools', toolId);
      
      // 수정할 데이터 준비 (평점 관련 필드는 제외)
      const updatedTool = {
        ...toolData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(toolRef, updatedTool);
      console.log('✅ 도구 수정 완료:', toolData.name);
      
    } catch (error: any) {
      console.error('❌ 도구 수정 실패:', error);
      throw new Error(error.message || '도구 수정 중 오류가 발생했습니다.');
    }
  };

  /**
   * 기존 도구를 Firestore에서 삭제
   * @param toolId 삭제할 도구 ID
   * @param userId 도구를 삭제하는 사용자 ID
   */
  const deleteTool = async (toolId: string, userId: string): Promise<void> => {
    try {
      // 도구 문서 참조
      const toolRef = doc(db, 'tools', toolId);
      
      await deleteDoc(toolRef);
      console.log('✅ 도구 삭제 완료:', toolId);
      
    } catch (error: any) {
      console.error('❌ 도구 삭제 실패:', error);
      throw new Error(error.message || '도구 삭제 중 오류가 발생했습니다.');
    }
  };

  // 사용 가능한 카테고리 목록 추출 부분 제거

  return {
    data,
    isLoading,
    error,
    addTool,
    updateTool,
    deleteTool,
    categories: categoryList
  };
}

/**
 * 특정 도구의 상세 정보를 가져오는 훅
 * @param toolId 도구 ID
 * @returns 도구 정보, 로딩 상태, 에러
 */
export function useTool(toolId: string): {
  data: FirebaseTool | null;
  isLoading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<FirebaseTool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      // 특정 도구 문서 실시간 구독
      const toolQuery = query(
        collection(db, 'tools'),
        where('__name__', '==', toolId)
      );

      const unsubscribe = onSnapshot(
        toolQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const docData = doc.data();
            
            setData({
              id: doc.id,
              name: docData.name,
              category: docData.category,
              url: docData.url,
              description: docData.description,
              memo: docData.memo,
              plan: docData.plan,
              averageRating: docData.averageRating || 0,
              ratingCount: docData.ratingCount || 0,
              createdAt: docData.createdAt?.toDate() || new Date(),
              updatedAt: docData.updatedAt?.toDate() || new Date(),
              createdBy: docData.createdBy
            });
            setIsLoading(false);
          } else {
            setError('도구를 찾을 수 없습니다.');
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('❌ 도구 조회 실패:', error);
          setError('도구 정보를 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (error: any) {
      console.error('❌ 도구 쿼리 설정 실패:', error);
      setError(error.message || '도구 정보 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [toolId]);

  return {
    data,
    isLoading,
    error
  };
} 