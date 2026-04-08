
import { GoogleGenAI, Type } from "@google/genai";
import { Paper, AnalysisResponse } from "../types";

/**
 * Creates a fresh instance of GoogleGenAI using the environment variable.
 * Per guidelines, this should be called right before an API call to ensure
 * the most up-to-date key from the system dialog is used.
 */
const getClient = () => {
  const apiKey = process.env.API_KEY; 
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper to handle errors, specifically checking for the "entity not found" 
 * which signals a need for key re-selection in this platform.
 */
const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const message = error?.message || String(error);
  if (message.includes("Requested entity was not found")) {
    return "API 金鑰無效或找不到該專案。請嘗試重新設定金鑰。";
  }
  return "連線失敗，請檢查網路或 API 額度。";
};

/**
 * Simulates the "Crawler" by using Google Search Grounding to find recent papers.
 */
export const fetchLatestPapers = async (topic: string, journal: string): Promise<Paper[]> => {
  const client = getClient();
  const query = `Find 3 most recent scientific research papers published in ${journal === '所有期刊' ? 'major psychiatry journals' : journal} about "${topic === '所有主題' ? 'psychiatry' : topic}" published in the last 30 days. 
  
  Return the result as a JSON array where each object has these fields: 
  - title (string)
  - journal (string)
  - date (string)
  - url (string)
  - abstract (string, brief summary in English)

  Important: Return ONLY the JSON array. Do not use markdown formatting.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let text = response.text;
    if (!text) return [];
    
    text = text.replace(/```json|```/g, '').trim();
    
    let rawPapers: any[] = [];
    try {
        rawPapers = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON from search result", text);
        return [];
    }
    
    if (!Array.isArray(rawPapers)) return [];

    return rawPapers.map((p: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      title: p.title || 'Untitled',
      journal: p.journal || 'Unknown Journal',
      date: p.date || 'Recent',
      url: p.url || '#',
      abstract: p.abstract || '',
      isAnalyzed: false
    }));
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Performs deep PICO analysis and Translation on a specific paper.
 */
export const analyzePaperWithAI = async (paper: Paper): Promise<AnalysisResponse> => {
  const client = getClient();
  
  const prompt = `
    請以專業精神科醫師的角度分析以下研究論文摘要。
    
    標題: ${paper.title}
    摘要: ${paper.abstract || "未提供摘要，請根據標題推論。"}

    任務 (請務必使用繁體中文，並採用台灣醫學術語):
    1. 將標題翻譯為專業繁體中文。
    2. 用一句話總結研究的核心發現 (中文)。
    3. 提取 PICO (Population 病患群體, Intervention 介入措施, Comparison 對照組, Outcome 臨床結果) (內容請用中文)。
    4. 評估臨床實用價值 (高/中/低) 並說明理由 (中文)。
    5. 生成 2-3 個相關標籤 (中文)。
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleZh: { type: Type.STRING },
            summary: { type: Type.STRING },
            pico: {
              type: Type.OBJECT,
              properties: {
                p: { type: Type.STRING, description: 'Population/Patient' },
                i: { type: Type.STRING, description: 'Intervention' },
                c: { type: Type.STRING, description: 'Comparison' },
                o: { type: Type.STRING, description: 'Outcome' }
              }
            },
            utility: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis generated");
    return JSON.parse(text) as AnalysisResponse;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
