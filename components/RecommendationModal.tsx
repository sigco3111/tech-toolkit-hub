import React, { useState } from 'react';
import { AiTool } from '../types';
import ToolCard from './ToolCard';
// import { getAiRecommendation } from '../lib/gemini';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: AiTool[];
}

interface Recommendation {
    tool: AiTool;
    reason: string;
}

const RecommendationModal: React.FC<RecommendationModalProps> = ({ isOpen, onClose, tools: _ }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      // TODO: AI 추천 기능은 현재 비활성화됨 - lib/gemini 파일 필요
      setError('AI 추천 기능은 현재 사용할 수 없습니다. Gemini API 설정이 필요합니다.');
    } catch (err) {
      console.error(err);
      setError('AI 추천을 받는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state when closing
    setTimeout(() => {
        setQuery('');
        setRecommendation(null);
        setError(null);
        setIsLoading(false);
    }, 300); // Wait for closing animation
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-transform transform scale-95 duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">✨ AI 도우미</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </header>

        <div className="p-6 overflow-y-auto">
          {!recommendation ? (
            <form onSubmit={handleSubmit}>
              <label htmlFor="ai-query" className="block text-lg font-medium text-slate-700 mb-2">무엇을 하고 싶으신가요?</label>
              <p className="text-sm text-slate-500 mb-4">예: "멋진 로고 만들기", "외국어 실력 향상", "프로젝트 자동화"</p>
              <textarea
                id="ai-query"
                rows={4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                placeholder="여기에 원하는 작업을 설명해주세요..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="mt-4 w-full flex justify-center items-center gap-2 px-4 py-3 bg-sky-500 text-white font-bold rounded-lg shadow-md hover:bg-sky-600 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    분석 중...
                  </>
                ) : "추천 받기"}
              </button>
            </form>
          ) : (
            <div>
              <p className="text-lg font-medium text-slate-700 mb-4">"{query}" 작업에 가장 적합한 도구입니다!</p>
              <ToolCard tool={recommendation.tool} />
              <div className="mt-6 bg-slate-100 p-4 rounded-lg">
                <h4 className="font-bold text-slate-800 mb-2">🤖 AI가 제안하는 이유:</h4>
                <p className="text-slate-600">{recommendation.reason}</p>
              </div>
            </div>
          )}
          {error && <p className="mt-4 text-center text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>}
        </div>

        {recommendation && (
            <footer className="p-6 border-t border-slate-200">
                <button
                    onClick={() => { setRecommendation(null); setError(null); }}
                    className="w-full px-4 py-2 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition"
                >
                    다른 질문하기
                </button>
            </footer>
        )}
      </div>
    </div>
  );
};

export default RecommendationModal;
