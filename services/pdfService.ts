
// Access the global pdfjsLib injected via index.html script tag
declare const pdfjsLib: any;

/**
 * Extracts FULL text from ALL pages of a PDF.
 * @param file The PDF file object
 * @param charLimit Optional safety limit (default: 5,000,000 ~ approx 1000 pages, effectively unlimited for papers)
 */
export const extractTextFromPDF = async (file: File, charLimit: number = 5000000): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pageTexts: string[] = [];
    const totalPages = pdf.numPages;

    // BRUTE FORCE STRATEGY: Read EVERY single page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Join all text items on the page with a space
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      // Add explicit delimiters for AI context
      pageTexts.push(`--- PAGE ${pageNum} / ${totalPages} ---\n${pageText}`);
    }

    // Join all pages
    const fullText = pageTexts.join('\n\n');
    
    // Return full text, truncated only by the massive safety limit
    return fullText.slice(0, charLimit); 
  } catch (error) {
    console.error("Error reading PDF:", error);
    throw new Error("Failed to extract text from PDF. Ensure it is a valid PDF file.");
  }
};
