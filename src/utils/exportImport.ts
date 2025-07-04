/**
 * 도구 데이터 JSON 내보내기/가져오기 유틸리티
 * 사용자가 도구 데이터를 JSON 파일로 내보내거나 가져올 수 있도록 지원
 */
import { FirebaseTool, ToolInput } from '../../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  getDoc, 
  deleteDoc, 
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

/**
 * 모든 도구 데이터를 JSON 형식으로 내보내는 함수
 * @returns JSON 형식의 도구 데이터
 */
export const exportToolsToJson = async (): Promise<string> => {
  try {
    // Firestore에서 모든 도구 가져오기
    const toolsCollection = collection(db, 'tools');
    const toolsSnapshot = await getDocs(toolsCollection);
    
    const toolsData: FirebaseTool[] = [];
    
    toolsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // 날짜 객체를 ISO 문자열로 변환 (JSON 직렬화를 위해)
      const tool: FirebaseTool = {
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
      };
      
      toolsData.push(tool);
    });
    
    // JSON으로 직렬화할 수 있도록 날짜 객체를 문자열로 변환
    const toolsForExport = toolsData.map(tool => ({
      ...tool,
      createdAt: tool.createdAt.toISOString(),
      updatedAt: tool.updatedAt.toISOString()
    }));
    
    return JSON.stringify(toolsForExport, null, 2);
  } catch (error) {
    console.error('도구 데이터 내보내기 오류:', error);
    throw new Error('도구 데이터를 내보내는 중 오류가 발생했습니다.');
  }
};

/**
 * JSON 파일을 다운로드하는 함수
 * @param jsonString JSON 문자열
 * @param fileName 파일 이름
 */
export const downloadJsonFile = (jsonString: string, fileName: string = 'tools.json'): void => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  
  URL.revokeObjectURL(url);
};

/**
 * JSON 문자열에서 도구 데이터 가져오기
 * @param jsonString JSON 문자열
 * @returns 파싱된 도구 데이터
 */
export const parseToolsFromJson = (jsonString: string): {
  validTools: ToolInput[];
  invalidEntries: any[];
} => {
  try {
    const parsedData = JSON.parse(jsonString);
    
    if (!Array.isArray(parsedData)) {
      throw new Error('유효하지 않은 데이터 형식입니다. 배열이 필요합니다.');
    }
    
    const validTools: ToolInput[] = [];
    const invalidEntries: any[] = [];
    
    parsedData.forEach((item: any) => {
      // 필수 필드 검증
      if (
        typeof item.name === 'string' && item.name.trim() !== '' &&
        typeof item.category === 'string' && item.category.trim() !== '' &&
        typeof item.url === 'string' && item.url.trim() !== '' &&
        typeof item.description === 'string'
      ) {
        const toolInput: ToolInput = {
          name: item.name,
          category: item.category,
          url: item.url,
          description: item.description,
          memo: typeof item.memo === 'string' ? item.memo : '',
          plan: typeof item.plan === 'string' ? item.plan : null
        };
        
        validTools.push(toolInput);
      } else {
        invalidEntries.push(item);
      }
    });
    
    return { validTools, invalidEntries };
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
    throw new Error('JSON 데이터를 파싱하는 중 오류가 발생했습니다.');
  }
};

/**
 * JSON에서 가져온 도구 데이터를 Firebase에 저장
 * @param tools 도구 데이터 배열
 * @param userId 사용자 ID
 * @param mode 가져오기 모드 ('append': 기존 데이터에 추가, 'replace': 기존 데이터 삭제 후 추가)
 * @returns 가져오기 결과 요약
 */
export const importToolsToFirebase = async (
  tools: ToolInput[],
  userId: string,
  mode: 'append' | 'replace' = 'append'
): Promise<{ success: number; failed: number }> => {
  try {
    // 'replace' 모드인 경우 기존 도구 데이터 삭제
    if (mode === 'replace') {
      // 배치 작업 생성 (최대 500개 작업까지 지원)
      const batch = writeBatch(db);
      
      // 기존 도구 가져오기
      const toolsCollection = collection(db, 'tools');
      const toolsSnapshot = await getDocs(toolsCollection);
      
      // 도구 수가 많으면 여러 배치로 나누어 삭제해야 함
      const MAX_BATCH_SIZE = 500;
      
      if (toolsSnapshot.size <= MAX_BATCH_SIZE) {
        // 한 번의 배치로 삭제 가능한 경우
        toolsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        // 배치 작업 실행
        await batch.commit();
      } else {
        // 여러 배치로 나누어 삭제
        let batchCount = 0;
        let currentBatch = writeBatch(db);
        
        // 배열로 변환하여 인덱스와 함께 사용
        const docsArray = toolsSnapshot.docs;
        
        docsArray.forEach((doc, index) => {
          currentBatch.delete(doc.ref);
          batchCount++;
          
          if (batchCount >= MAX_BATCH_SIZE || index === docsArray.length - 1) {
            // 배치 실행 및 새 배치 생성
            currentBatch.commit();
            currentBatch = writeBatch(db);
            batchCount = 0;
          }
        });
      }
    }
    
    // 도구 추가
    let successCount = 0;
    let failCount = 0;
    
    const toolsCollection = collection(db, 'tools');
    
    for (const tool of tools) {
      try {
        const timestamp = serverTimestamp();
        
        await addDoc(toolsCollection, {
          ...tool,
          averageRating: 0,
          ratingCount: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: userId
        });
        
        successCount++;
      } catch (error) {
        console.error('도구 추가 오류:', error, tool);
        failCount++;
      }
    }
    
    return {
      success: successCount,
      failed: failCount
    };
  } catch (error) {
    console.error('도구 데이터 가져오기 오류:', error);
    throw new Error('도구 데이터를 가져오는 중 오류가 발생했습니다.');
  }
}; 