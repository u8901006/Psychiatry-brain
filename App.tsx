
import React, { useState, useEffect } from 'react';
import { INITIAL_PAPERS } from './constants';
import { Paper, Tab, JournalFilter, TopicFilter } from './types';
import { PaperCard } from './components/PaperCard';
import { ArchitectureInfo } from './components/ArchitectureInfo';
import { fetchLatestPapers } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.FEED);
  const [papers, setPapers] = useState<Paper[]>(INITIAL_PAPERS);
  const [selectedTopic, setSelectedTopic] = useState<TopicFilter>(TopicFilter.ALL);
  const [selectedJournal, setSelectedJournal] = useState<string>(JournalFilter.ALL);
  const [isFetching, setIsFetching] = useState(false);
  
  const [customJournals, setCustomJournals] = useState<string[]>([]);
  const [newJournalInput, setNewJournalInput] = useState('');
  const [showJournalManager, setShowJournalManager] = useState(false);

  // API Key States
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Initial check for API Key using platform-specific window extension
    const checkApiKey = async () => {
      // @ts-ignore - aistudio is injected by the platform
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback or development environment check
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkApiKey();

    const savedCustom = localStorage.getItem('psych_brain_custom_journals');
    if (savedCustom) {
      setCustomJournals(JSON.parse(savedCustom));
    }
    
    const savedPapers = localStorage.getItem('psych_brain_feed_cache');
    if (savedPapers) {
      setPapers(JSON.parse(savedPapers));
    }
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success as per race condition instructions provided in guidelines
      setHasApiKey(true);
      setApiError(null);
    } else {
      alert("此環境不支援系統金鑰選取器。請確認 process.env.API_KEY 已正確設定。");
    }
  };

  useEffect(() => {
    localStorage.setItem('psych_brain_custom_journals', JSON.stringify(customJournals));
  }, [customJournals]);

  const handleAddJournal = () => {
    if (!newJournalInput.trim()) return;
    
    const journalsToAdd = newJournalInput
      .split(',')
      .map(j => j.trim())
      .filter(j => j && !customJournals.includes(j) && !Object.values(JournalFilter).includes(j as JournalFilter));

    if (journalsToAdd.length > 0) {
      setCustomJournals(prev => [...prev, ...journalsToAdd]);
      setNewJournalInput('');
    }
  };

  const handleRemoveJournal = (journal: string) => {
    setCustomJournals(prev => prev.filter(j => j !== journal));
    if (selectedJournal === journal) {
      setSelectedJournal(JournalFilter.ALL);
    }
  };

  const handlePaperUpdate = (updatedPaper: Paper) => {
    setPapers(prev => {
      const newPapers = prev.map(p => p.id === updatedPaper.id ? updatedPaper : p);
      localStorage.setItem('psych_brain_feed_cache', JSON.stringify(newPapers));
      return newPapers;
    });
  };

  const handleRefresh = async () => {
    if (!hasApiKey && !process.env.API_KEY) {
      setApiError("請先設定 API 金鑰。");
      return;
    }

    setIsFetching(true);
    setApiError(null);
    try {
      const newPapers = await fetchLatestPapers(selectedTopic, selectedJournal);
      setPapers(prev => {
        const updated = [...newPapers, ...prev];
        const truncated = updated.slice(0, 50);
        localStorage.setItem('psych_brain_feed_cache', JSON.stringify(truncated));
        return updated;
      });
    } catch (e: any) {
      setApiError(e.message || "文獻獲取失敗。");
      // If error indicates key issue, update status
      if (e.message.includes("金鑰無效")) {
        setHasApiKey(false);
      }
    } finally {
      setIsFetching(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
  const allAvailableJournals = [...Object.values(JournalFilter), ...customJournals];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Psychiatry Brain</h1>
              <p className="text-xs text-gray-500 font-medium mt-1">AI 驅動的精神醫學研究情報系統</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                 <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                 {hasApiKey ? 'API 已連線' : 'API 未連結'} | {currentDate}
              </div>
              <button 
                onClick={handleSelectKey}
                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold tracking-wide"
              >
                {hasApiKey ? '更換 Google API 金鑰' : '設定 API 金鑰'}
              </button>
            </div>
          </div>

          <div className="flex space-x-6 border-b border-gray-100">
            <button
              onClick={() => setActiveTab(Tab.FEED)}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === Tab.FEED
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              每日文獻
            </button>
            <button
              onClick={() => setActiveTab(Tab.ARCHITECTURE)}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === Tab.ARCHITECTURE
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              系統架構
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* API Key Missing Banner */}
        {hasApiKey === false && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-800">尚未設定 API 金鑰</h4>
                <p className="text-xs text-red-600">請連結您的 Google AI Studio 金鑰以啟用研究分析與搜尋功能。</p>
              </div>
            </div>
            <button 
              onClick={handleSelectKey}
              className="whitespace-nowrap bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 shadow-sm transition-colors"
            >
              立即設定
            </button>
          </div>
        )}

        {activeTab === Tab.FEED && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                 <select 
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value as TopicFilter)}
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                 >
                   {Object.values(TopicFilter).map(topic => (
                     <option key={topic} value={topic}>{topic}</option>
                   ))}
                 </select>
                 <select 
                    value={selectedJournal}
                    onChange={(e) => setSelectedJournal(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                 >
                   {allAvailableJournals.map(journal => (
                     <option key={journal} value={journal}>{journal}</option>
                   ))}
                 </select>
                 <button
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition-all active:scale-95"
                 >
                   {isFetching ? (
                     <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   ) : (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                   )}
                   {isFetching ? '掃描中...' : '獲取最新'}
                 </button>
              </div>
              
              <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowJournalManager(!showJournalManager)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    {showJournalManager ? '隱藏期刊管理' : '管理自定義期刊'}
                  </button>
                </div>
                {apiError && <p className="text-[10px] text-red-500 font-bold animate-pulse">{apiError}</p>}
                <p className="text-[10px] text-gray-400">
                  * 利用 Google Search 即時掃描各大期刊與 PubMed 最新論文。
                </p>
              </div>

              {showJournalManager && (
                <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 animate-fade-in">
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text"
                      placeholder="輸入期刊名稱（多個請用逗號隔開）"
                      value={newJournalInput}
                      onChange={(e) => setNewJournalInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddJournal()}
                      className="flex-1 bg-white border border-gray-200 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <button 
                      onClick={handleAddJournal}
                      className="bg-gray-800 text-white text-xs px-4 py-2 rounded-lg hover:bg-black transition-colors"
                    >
                      新增期刊
                    </button>
                  </div>
                  
                  {customJournals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {customJournals.map(j => (
                        <span key={j} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md border border-blue-200">
                          {j}
                          <button onClick={() => handleRemoveJournal(j)} className="hover:text-red-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">尚未新增任何自定義期刊</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {papers.map(paper => (
                <PaperCard 
                  key={paper.id} 
                  paper={paper} 
                  onUpdate={handlePaperUpdate} 
                />
              ))}
            </div>
            
            {papers.length === 0 && (
              <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                目前沒有任何文獻。請調整篩選器或點擊上方「獲取最新」進行掃描。
              </div>
            )}
          </div>
        )}

        {activeTab === Tab.ARCHITECTURE && (
          <ArchitectureInfo />
        )}
      </main>
      
      {/* Footer Info / OpenAI Note */}
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center border-t border-gray-200 mt-10">
        <p className="text-[10px] text-gray-400">
          本應用程式專為 Gemini 3 系列模型最佳化，以提供最精確的精神醫學推理與 Google Search 實時接地能力。
          <br />
          基於安全與功能整合考量，請使用系統整合的 Google 金鑰選取器進行連結。目前不支援第三方 API 匯入。
        </p>
      </footer>
    </div>
  );
};

export default App;
