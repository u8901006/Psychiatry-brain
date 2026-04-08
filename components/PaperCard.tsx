
import React, { useState, useEffect } from 'react';
import { Paper } from '../types';
import { analyzePaperWithAI } from '../services/geminiService';

interface Props {
  paper: Paper;
  onUpdate: (updatedPaper: Paper) => void;
}

export const PaperCard: React.FC<Props> = ({ paper, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('psych_brain_saved_papers');
      if (savedRaw) {
        const savedPapers: Paper[] = JSON.parse(savedRaw);
        const savedPaper = savedPapers.find(p => p.id === paper.id);
        if (savedPaper) {
          setIsSaved(true);
          if (savedPaper.isAnalyzed && !paper.isAnalyzed) {
            onUpdate(savedPaper);
          }
        }
      }
    } catch (e) {
      console.error("Error reading from local storage", e);
    }
  }, [paper.id, onUpdate, paper.isAnalyzed]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const analysis = await analyzePaperWithAI(paper);
      const updatedPaper = {
        ...paper,
        ...analysis,
        isAnalyzed: true
      };
      onUpdate(updatedPaper);
      if (isSaved) {
        updateLocalStorage(updatedPaper);
      }
    } catch (err) {
      setError('分析失敗，請檢查 API Key 或稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const updateLocalStorage = (paperToSave: Paper) => {
    try {
      const savedRaw = localStorage.getItem('psych_brain_saved_papers');
      let savedPapers: Paper[] = savedRaw ? JSON.parse(savedRaw) : [];
      savedPapers = savedPapers.filter(p => p.id !== paperToSave.id);
      savedPapers.push(paperToSave);
      localStorage.setItem('psych_brain_saved_papers', JSON.stringify(savedPapers));
    } catch (e) {
      console.error("Error updating local storage", e);
    }
  };

  const handleToggleSave = () => {
    try {
      const savedRaw = localStorage.getItem('psych_brain_saved_papers');
      let savedPapers: Paper[] = savedRaw ? JSON.parse(savedRaw) : [];
      if (isSaved) {
        savedPapers = savedPapers.filter(p => p.id !== paper.id);
        setIsSaved(false);
      } else {
        savedPapers = savedPapers.filter(p => p.id !== paper.id);
        savedPapers.push(paper);
        setIsSaved(true);
      }
      localStorage.setItem('psych_brain_saved_papers', JSON.stringify(savedPapers));
    } catch (e) {
      console.error("Error toggling save", e);
      alert("無法儲存至本地瀏覽器快取。");
    }
  };

  const handleCopy = () => {
    if (!paper.isAnalyzed) return;
    const text = `
【${paper.journal}】${paper.titleZh || paper.title}
刊登日期：${paper.date}
連結：${paper.url}

核心精要：
${paper.summary}

PICO 分析：
- 病患群體 (P): ${paper.pico?.p}
- 介入措施 (I): ${paper.pico?.i}
- 對照組 (C): ${paper.pico?.c}
- 臨床結果 (O): ${paper.pico?.o}

臨床應用價值：
${paper.utility}

標籤：${paper.tags?.map(t => `#${t}`).join(' ')}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      alert('分析內容已成功複製到剪貼簿！');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('複製失敗，請手動選取文字。');
    });
  };

  const journalColor = (journal: string) => {
    if (journal.includes('NEJM')) return 'bg-blue-100 text-blue-800';
    if (journal.includes('Lancet')) return 'bg-red-100 text-red-800';
    if (journal.includes('JAMA')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-xs font-bold ${journalColor(paper.journal)}`}>
            {paper.journal}
          </span>
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
            {paper.date}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
          {paper.isAnalyzed && (
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              title="複製分析內容"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
              複製
            </button>
          )}
          <button 
            onClick={handleToggleSave}
            className={`flex items-center gap-1 transition-colors ${isSaved ? 'text-blue-600' : 'hover:text-blue-600'}`}
            title={isSaved ? "取消收藏" : "加入收藏"}
          >
            <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            {isSaved ? '已收藏' : '收藏'}
          </button>
          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center gap-1">
            查閱原文 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <h3 className="text-gray-400 text-sm font-light mb-1 leading-snug">
          {paper.title}
        </h3>
        
        {paper.isAnalyzed && paper.titleZh ? (
           <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 leading-tight">
            {paper.titleZh}
          </h2>
        ) : (
          <div className="mt-2 mb-4">
             <h2 className="text-xl font-bold text-gray-300">
               尚未執行深度分析...
             </h2>
          </div>
        )}

        {!paper.isAnalyzed && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-blue-600 mb-2">啟動 AI 專業翻譯與 PICO 重點精煉</p>
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Gemini 醫學助手正在分析中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  執行 AI 臨床分析
                </>
              )}
            </button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        )}

        {paper.isAnalyzed && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h4 className="text-blue-900 font-bold text-sm mb-1">核心精要</h4>
              <p className="text-blue-800 text-base font-medium">
                {paper.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">病患群體 (P)</span>
                <p className="text-sm text-gray-700">{paper.pico?.p}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">介入措施 (I)</span>
                <p className="text-sm text-gray-700">{paper.pico?.i}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">對照組 (C)</span>
                <p className="text-sm text-gray-700">{paper.pico?.c}</p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider block mb-1">臨床結果 (O)</span>
                <p className="text-sm text-green-800 font-medium">{paper.pico?.o}</p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <span className="flex items-center gap-1 text-amber-700 font-bold text-sm mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  臨床應用價值
                </span>
                <p className="text-sm text-amber-800">{paper.utility}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {paper.tags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white text-gray-600 text-xs rounded border border-gray-200">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
