
import { GoogleGenAI, Type } from "@google/genai";
import { PaperMetadata } from "../types";

// Default fallback if no custom key is provided
const DEFAULT_ENV_KEY = process.env.API_KEY;

// Helper to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates the API Key and Model by attempting a minimal generation.
 */
export const validateConnection = async (apiKey: string, model: string): Promise<boolean> => {
  const effectiveKey = apiKey || DEFAULT_ENV_KEY;
  if (!effectiveKey) throw new Error("No API Key provided");

  const ai = new GoogleGenAI({ apiKey: effectiveKey });
  try {
    await ai.models.generateContent({
      model: model,
      contents: "Test connection.",
    });
    return true;
  } catch (error) {
    console.error("Connection Validation Failed:", error);
    throw error;
  }
};

/**
 * Analyzes paper text using the specified API Key and Model.
 */
export const analyzePaperText = async (
  text: string, 
  existingCategories: string[],
  apiKey: string,
  modelName: string
): Promise<PaperMetadata> => {
  
  const effectiveKey = apiKey || DEFAULT_ENV_KEY;
  
  if (!effectiveKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }

  // Create a fresh instance for every request to ensure the latest Key/Model is used
  const ai = new GoogleGenAI({ apiKey: effectiveKey });
  
  const categoriesList = existingCategories.join(', ');

  const prompt = `
    Analyze the provided text from a research paper. 
    **NOTE:** The text provided is the **FULL CONTENT** of the entire PDF document (all pages).
    You have access to every single word in the paper.

    ### 1. AUTHOR EXTRACTION (Full Names):
    - **authorsFull:** Extract full names (Firstname Lastname).
    - **authorsAbbrev:** Standard citation format (Surname, Initials).

    ### 2. SENIOR AUTHOR / PI IDENTIFICATION:
    - Identify the Principal Investigator (Lab Head).
    - Look for Asterisk (*), "Corresponding Author", or the Last Author if they are a senior professor.

    ### 3. YEAR EXTRACTION (DOI PRIORITY & MAX STRATEGY):
    - **GOAL:** Determine the final publication year (Volume Year).
    - **CONTEXT:** Scan the ENTIRE document text.
    
    **LOGIC TRACE REQUIREMENT:** 
    You MUST populate the field \`debugYearSource\` with the specific reason.
    
    - **PRIORITY 1: DOI YEAR (HIGHEST PRIORITY):**
        - **LOOK FOR A DOI** anywhere in the full text (e.g., headers, footers, references, margins).
        - **IF the DOI contains a 4-digit year** (e.g. ".2025." or "-2025-"):
            - Use this year.
            - Set \`debugYearSource\` to "DOI Found in Full Text: [THE_DOI_STRING]".
    
    - **PRIORITY 2: MAXIMUM YEAR STRATEGY (If no DOI year):**
      1.  **SCAN** for valid context dates throughout the full text: 
          - "Copyright © 20xx"
          - "Published 20xx"
          - "Available online 20xx"
          - "Volume X (20xx)"
      2.  **CHECK** headers/footers on every page (already included in text).
      3.  **IGNORE** invalid contexts: "Received", "Revised", "Submitted".
      4.  **SELECT THE LATEST YEAR:** 
          - Set \`debugYearSource\` to "Max of dates found in Full Text: [List of dates found] (Context: [Context found])".
    
    - **FALLBACK:**
        - If NO valid dates found anywhere:
        - Set \`year\` to "Unknown".
        - Set \`debugYearSource\` to "No valid year context found even in Full Text.".

    ### 4. CLASSIFICATION:
    Assign to one of: [${categoriesList}].
    - If no fit, create a NEW, concise CamelCase category.

    ### 5. JOURNAL / SOURCE:
    - Identify the Journal Name.
    - **PREPRINT RULE:** If source is arXiv, bioRxiv, or Unknown, set 'journal' to "**Preprint**".

    ### 6. FILENAME GENERATION (Strict Format):
    - Format: \`Year_FirstAuthorFullName_[SeniorAuthorFullName]_FullTitle.pdf\`
    - **Title:** USE FULL TITLE. No abbreviations. Replace spaces with underscores or hyphens.
    - **Example:** "2025_Tianjie_Ding_[Stelios_Rigopoulos]_Machine-learning-tabulation.pdf"

    Text Content:
    ${text}
  `;

  let retries = 0;
  const maxRetries = 3; // Reduced default retries since user can manual retry

  while (true) {
    try {
      const response = await ai.models.generateContent({
        model: modelName, // Use dynamic model
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              // Full names for UI Display
              authorsFull: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of Full Names" },
              seniorAuthorFull: { type: Type.STRING, description: "Full Name of Senior Author/PI" },
              
              // Abbreviated names for Logic/Ref
              authorsAbbrev: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List formatted as 'Surname, I. I.'" },
              seniorAuthorAbbrev: { type: Type.STRING, description: "Formatted as 'Surname, I. I.'" },
              
              year: { type: Type.STRING, description: "Publication Year or 'Unknown'." },
              debugYearSource: { type: Type.STRING, description: "EXACT EXPLANATION of how the year was chosen. E.g., 'DOI Found: 10.1016...2025' or 'Max of [2023, 2024]'." },
              
              category: { type: Type.STRING },
              journal: { type: Type.STRING, description: "Journal Name or 'Preprint'" },
              summary: { type: Type.STRING },
              suggestedFilename: { type: Type.STRING, description: "Generated filename. MUST start with the Year." },
            },
            required: ["title", "authorsFull", "seniorAuthorFull", "year", "debugYearSource", "category", "journal", "suggestedFilename"],
          },
        },
      });

      if (!response.text) {
        throw new Error("No response from AI");
      }

      return JSON.parse(response.text) as PaperMetadata;

    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429');
      const isServerOverload = error?.status === 503 || error?.code === 503;

      if ((isRateLimit || isServerOverload) && retries < maxRetries) {
        retries++;
        const delay = 2000 * Math.pow(2, retries - 1);
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        await wait(delay);
        continue;
      }

      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }
};
