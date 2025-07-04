// Firebase 데이터 마이그레이션 스크립트
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';

// 환경변수 로드
config();
import { getFirestore, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

// Firebase 설정 (환경 변수 사용)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * JSON 파일에서 도구 데이터를 가져와 Firestore로 마이그레이션하는 메인 함수
 * @param {string} jsonFilePath - 도구 데이터가 있는 JSON 파일 경로
 */
async function migrateToolsFromJson(jsonFilePath: string) {
  console.log('🚀 JSON 파일에서 데이터 마이그레이션을 시작합니다...');
  
  try {
    // JSON 파일 읽기
    const fs = require('fs');
    const toolsData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    if (!Array.isArray(toolsData)) {
      throw new Error('JSON 파일은 배열 형태의 도구 데이터여야 합니다.');
    }
    
    const toolsCollection = collection(db, 'tools');
    let successCount = 0;
    let errorCount = 0;

    for (const tool of toolsData) {
      try {
        // 도구 데이터를 FirebaseTool 형식으로 변환
        const firebaseTool = {
          name: tool.name,
          category: tool.category,
          url: tool.url,
          description: tool.description,
          memo: tool.memo || '',
          plan: tool.plan,
          averageRating: tool.rating || 0,
          ratingCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'system'
        };

        await addDoc(toolsCollection, firebaseTool);
        successCount++;
        console.log(`✅ ${tool.name} 마이그레이션 완료`);
        
      } catch (error) {
        console.error(`❌ ${tool.name} 마이그레이션 실패:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 마이그레이션 완료 요약:');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log(`📋 전체: ${toolsData.length}개`);
    
    if (errorCount === 0) {
      console.log('\n🎉 모든 데이터가 성공적으로 마이그레이션되었습니다!');
    }
    
  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  }
}

/**
 * Firestore의 도구 데이터에서 카테고리 목록을 추출하여 별도 컬렉션으로 저장
 */
async function migrateCategoriesFromFirestore() {
  console.log('\n🏷️  카테고리 데이터 마이그레이션 시작...');
  
  try {
    const toolsCollection = collection(db, 'tools');
    const toolsSnapshot = await getDocs(toolsCollection);
    const tools = toolsSnapshot.docs.map(doc => doc.data());
    
    // 카테고리 추출 및 중복 제거
    const categories = [...new Set(tools.map(tool => tool.category))];
    const categoriesCollection = collection(db, 'categories');

    for (const category of categories) {
      const categoryDoc = {
        name: category,
        toolCount: tools.filter(tool => tool.category === category).length,
        createdAt: serverTimestamp()
      };

      await addDoc(categoriesCollection, categoryDoc);
      console.log(`✅ 카테고리 '${category}' 마이그레이션 완료`);
    }

    console.log(`\n✅ ${categories.length}개 카테고리 마이그레이션 완료`);
    
  } catch (error) {
    console.error('❌ 카테고리 마이그레이션 실패:', error);
  }
}

/**
 * 마이그레이션 실행 함수
 */
async function runMigration(jsonFilePath: string) {
  try {
    await migrateToolsFromJson(jsonFilePath);
    await migrateCategoriesFromFirestore();
    
    console.log('\n🎊 전체 마이그레이션이 완료되었습니다!');
    console.log('Firebase Console에서 데이터를 확인해보세요.');
    
  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 명령줄 인자에서 JSON 파일 경로를 받음
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('❌ JSON 파일 경로를 지정해주세요.');
  console.log('사용법: npm run migrate-data -- <json-file-path>');
  process.exit(1);
}

// 스크립트 실행
runMigration(jsonFilePath);

export { migrateToolsFromJson, migrateCategoriesFromFirestore }; 