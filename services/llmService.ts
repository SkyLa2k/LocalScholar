
import { GoogleGenAI, Type } from "@google/genai";
import { AppSettings, PaperMetadata, LLMProvider } from "../types";

const GET_DEFAULT_KEY = () => {
  try {
    return process.env.API_KEY || "";
  } catch {
    return "";
  }
};

const FALLBACK_GOOGLE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-flash-latest'
];

const cleanUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/\/+$/, '');
};

const sanitizeMetadata = (raw: any): PaperMetadata => {
    return {
        title: raw.title || "Untitled",
        authorsFull: Array.isArray(raw.authorsFull) ? raw.authorsFull : [],
        seniorAuthorFull: raw.seniorAuthorFull || "",
        authorsAbbrev: Array.isArray(raw.authorsAbbrev) ? raw.authorsAbbrev : [],
        seniorAuthorAbbrev: raw.seniorAuthorAbbrev || "",
        year: raw.year || "Unknown",
        debugYearSource: raw.debugYearSource || "",
        category: raw.category || "Uncategorized",
        journal: raw.journal || "Unknown",
        summary: raw.summary || "",
        suggestedFilename: raw.suggestedFilename || "paper.pdf"
    };
};

const generatePrompt = (text: string, existingCategories: string[]) => {
  const categoriesList = existingCategories.join(', ');
  return `
    Analyze the provided research paper text. Return a JSON object ONLY.
    {
      "title": "Full title",
      "authorsFull": ["Full Name 1", "Full Name 2"],
      "seniorAuthorFull": "PI Full Name",
      "authorsAbbrev": ["Surname, I."],
      "year": "YYYY (from DOI or copyright)",
      "debugYearSource": "Reasoning for year",
      "category": "Classification from [${categoriesList}] or new concise category",
      "journal": "Journal Name or 'Preprint'",
      "summary": "1-sentence summary",
      "suggestedFilename": "YYYY_FirstAuthor_[SeniorAuthor]_Title.pdf"
    }
    Text: ${text.slice(0, 50000)}
  `;
};

const parseJSONResponse = (raw: string): any => {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(raw);
  } catch (e) {
    throw new Error("AI 返回了无效的 JSON 格式。");
  }
};

// --- Google Gemini ---
const listGoogleModels = async (apiKey: string): Promise<string[]> => {
  const effectiveKey = apiKey || GET_DEFAULT_KEY();
  if (!effectiveKey) return FALLBACK_GOOGLE_MODELS;
  const ai = new GoogleGenAI({ apiKey: effectiveKey });
  try {
    const response = await ai.models.list();
    const models: string[] = [];
    for await (const model of response) {
      const name = model.name?.replace(/^models\//, '') || '';
      if ((model as any).supportedGenerationMethods?.includes('generateContent')) {
          models.push(name);
      }
    }
    return models.length > 0 ? models : FALLBACK_GOOGLE_MODELS;
  } catch {
    return FALLBACK_GOOGLE_MODELS;
  }
};

const analyzeGoogle = async (text: string, categories: string[], settings: AppSettings): Promise<PaperMetadata> => {
  const effectiveKey = settings.apiKey || GET_DEFAULT_KEY();
  if (!effectiveKey) throw new Error("缺少 Google API Key。");
  const ai = new GoogleGenAI({ apiKey: effectiveKey });
  const response = await ai.models.generateContent({
    model: settings.model || 'gemini-3-flash-preview',
    contents: generatePrompt(text, categories),
    config: { responseMimeType: "application/json" },
  });
  return sanitizeMetadata(parseJSONResponse(response.text));
};

// --- OpenAI / DeepSeek ---
const listOpenAIModels = async (settings: AppSettings): Promise<string[]> => {
    try {
        const baseUrl = cleanUrl(settings.baseUrl);
        const effectiveKey = settings.apiKey || GET_DEFAULT_KEY();
        const response = await fetch(`${baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${effectiveKey}` }
        });
        const data = await response.json();
        return data.data.map((m: any) => m.id).sort();
    } catch {
        return settings.provider === 'deepseek' ? ['deepseek-chat'] : ['gpt-4o', 'gpt-4o-mini'];
    }
};

const analyzeOpenAI = async (text: string, categories: string[], settings: AppSettings): Promise<PaperMetadata> => {
    const baseUrl = cleanUrl(settings.baseUrl);
    const effectiveKey = settings.apiKey || GET_DEFAULT_KEY();
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
            model: settings.model,
            messages: [{ role: 'user', content: generatePrompt(text, categories) }],
            response_format: { type: "json_object" }, 
            temperature: 0.1
        })
    });
    const data = await response.json();
    return sanitizeMetadata(parseJSONResponse(data.choices?.[0]?.message?.content || "{}"));
};

// --- Ollama ---
const listOllamaModels = async (settings: AppSettings): Promise<string[]> => {
    const baseUrl = cleanUrl(settings.baseUrl);
    const response = await fetch(`${baseUrl}/api/tags`);
    const data = await response.json();
    return data.models.map((m: any) => m.name).sort();
};

const analyzeOllama = async (text: string, categories: string[], settings: AppSettings): Promise<PaperMetadata> => {
    const baseUrl = cleanUrl(settings.baseUrl);
    const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: settings.model,
            prompt: generatePrompt(text, categories),
            format: "json",
            stream: false,
        })
    });
    const data = await response.json();
    return sanitizeMetadata(parseJSONResponse(data.response));
};

// --- Azure ---
const analyzeAzure = async (text: string, categories: string[], settings: AppSettings): Promise<PaperMetadata> => {
    const url = `${cleanUrl(settings.baseUrl)}/openai/deployments/${settings.model}/chat/completions?api-version=${settings.apiVersion}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'api-key': settings.apiKey || GET_DEFAULT_KEY() 
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: generatePrompt(text, categories) }],
            response_format: { type: "json_object" }
        })
    });
    const data = await response.json();
    return sanitizeMetadata(parseJSONResponse(data.choices?.[0]?.message?.content || "{}"));
};

export const getAvailableModels = async (settings: AppSettings): Promise<string[]> => {
    switch (settings.provider) {
        case 'google': return listGoogleModels(settings.apiKey);
        case 'openai': 
        case 'deepseek': return listOpenAIModels(settings);
        case 'ollama': return listOllamaModels(settings);
        case 'azure': return [];
        default: return [];
    }
};

export const analyzePaper = async (text: string, categories: string[], settings: AppSettings): Promise<PaperMetadata> => {
    switch (settings.provider) {
        case 'google': return analyzeGoogle(text, categories, settings);
        case 'openai': 
        case 'deepseek': return analyzeOpenAI(text, categories, settings);
        case 'ollama': return analyzeOllama(text, categories, settings);
        case 'azure': return analyzeAzure(text, categories, settings);
        default: throw new Error(`Provider unknown.`);
    }
};
