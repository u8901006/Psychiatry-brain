import { Paper } from './types';

// Simulate some initial "scraped" data that hasn't been analyzed by AI yet
// or has been pre-analyzed for the demo.
export const INITIAL_PAPERS: Paper[] = [
  {
    id: '2',
    journal: 'JAMA Psychiatry',
    date: '2025 Dec 15',
    title: 'Efficacy of Psilocybin in Treatment-Resistant Depression: A Randomized Clinical Trial',
    url: 'https://jamanetwork.com/journals/jamapsychiatry',
    isAnalyzed: false, // Needs AI analysis
    abstract: "This randomized clinical trial investigates the efficacy and safety of single-dose psilocybin versus placebo in adults with treatment-resistant depression."
  },
  {
    id: '3',
    journal: 'Lancet Psychiatry',
    date: '2025 Dec 14',
    title: 'Long-term outcomes of early intervention in psychosis services: A 10-year follow-up',
    url: 'https://www.thelancet.com/journals/lanpsy/home',
    isAnalyzed: false,
    abstract: "A longitudinal study tracking clinical and functional outcomes of patients who received early intervention services for first-episode psychosis."
  }
];

export const ARCHITECTURE_CONTENT = `
# 系統架構分析：Psychiatry Brain

為了構建一個每日更新高質量研究的穩健系統，我們評估了三種主要的技術途徑。

## 1. 傳統 Python 爬蟲 (Scrapy/BeautifulSoup) + 後端
**機制：** 伺服器每日運行 Python 腳本，從目標期刊網站抓取 HTML。
*   **優點：**
    *   **成本：** 營運成本低（無需支付昂貴的 API 查詢費用）。
    *   **控制權：** 可精確控制擷取的資料內容。
    *   **獨立性：** 不依賴第三方聚合平台。
*   **缺點：**
    *   **脆弱性：** 極度脆弱。若 NEJM 更改了 CSS class 名稱，爬蟲即會失效。
    *   **IP 封鎖：** 學術出版商積極封鎖爬蟲 IP，需要代理 (Proxy) 輪替機制。
    *   **維護：** 需不斷更新腳本，維護負擔重。

## 2. API 聚合 (PubMed/Crossref) + AI 過濾
**機制：** 使用官方 API (PubMed E-Utilities, Crossref) 獲取元數據，再將摘要輸入 LLM。
*   **優點：**
    *   **穩定性：** 官方 API 極少更動或中斷。
    *   **合法性：** 符合服務條款 (ToS)。
    *   **標準化：** 資料以結構化的 XML/JSON 格式提供。
*   **缺點：**
    *   **時間差：** PubMed 的索引可能比期刊官網發布晚數天甚至數週。
    *   **全文限制：** API 通常僅提供摘要，限制了 AI 分析的深度。

## 3. 混合模式：AI 驅動的實時瀏覽 (Agentic)
**機制：** 使用具備「接地 (Grounding/Search)」能力的 LLM 按需「閱讀」網路。
*   **優點：**
    *   **即時性：** 能找到*今天*剛剛發表的論文。
    *   **語境理解：** LLM 能有效解讀雜亂的 HTML 或摘要，無需嚴格的解析規則。
    *   **靈活性：** 無需重寫程式碼即可輕鬆切換至新主題。
*   **缺點：**
    *   **成本：** 搜尋與分析的 Token 消耗較高。
    *   **準確性：** 可能產生幻覺 (Hallucinations)；需要嚴格的驗證步驟。

## 推薦方案（本應用實作）
**前端優先結合 AI 代理 (Frontend-First with AI Agents)：**
我們採用 **Gemini API 搭配 Google Search Grounding**。這充當了一個智能、臨時的爬蟲。
1.  **發現：** 指示 Gemini「搜尋過去 7 天內在 [期刊] 發表的論文」。
2.  **分析：** 將搜尋到的片段傳遞給 Gemini 進行 PICO 提取與翻譯。
3.  **資料庫：** 儲存結果以避免重複搜尋（在生產環境中）。
`;