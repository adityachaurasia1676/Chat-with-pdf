/**
 * PDF Processing Utility
 * Uses pdfjs-dist to parse and extract text page-by-page.
 */

// Maximum supported PDF file size (25 MB)
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * Validate file before extraction
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePdfFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided. Please choose a PDF file.' };
  }

  const isPdfType = file.type === 'application/pdf';
  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfType && !isPdfExtension) {
    return {
      valid: false,
      error: `Invalid file format: "${file.name}". Please upload a valid PDF (.pdf) document.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The uploaded file is empty (0 bytes). Please upload a valid PDF.'
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 25 MB.`
    };
  }

  return { valid: true };
}

/**
 * Dynamically import pdfjs-dist and configure the worker
 */
async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    // Uses the local worker copied to the public folder
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
  return pdfjs;
}

/**
 * Extract readable text from a PDF file page by page
 * @param {File} file
 * @param {Function} [onProgress] - callback with { current, total, percentage }
 * @returns {Promise<{
 *   fileName: string,
 *   fileSize: number,
 *   totalPages: number,
 *   pages: Array<{ pageNumber: number, text: string }>,
 *   totalCharacters: number,
 *   totalWords: number
 * }>}
 */
export async function extractTextFromPdf(file, onProgress) {
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let pdfjs;
  try {
    pdfjs = await getPdfJs();
  } catch (err) {
    console.error('Failed to load PDF engine:', err);
    throw new Error('Could not initialize PDF reader. Please refresh and try again.');
  }

  let arrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (err) {
    console.error('Error reading file buffer:', err);
    throw new Error('Unable to read file data from device.');
  }

  let loadingTask;
  try {
    loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      standardFontDataUrl: '/standard_fonts/',
      useSystemFonts: true,
      isEvalSupported: false,
    });
  } catch (err) {
    console.error('Error creating PDF loading task:', err);
    throw new Error('Failed to parse PDF structure. The file may be corrupted.');
  }

  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err) {
    console.error('Error loading PDF document:', err);
    if (err.name === 'PasswordException') {
      throw new Error('This PDF is password protected. Please provide an unprotected PDF.');
    }
    if (err.name === 'InvalidPDFException') {
      throw new Error('The file is not a valid PDF document or contains corrupted data.');
    }
    throw new Error(err.message || 'Failed to open PDF document.');
  }

  const totalPages = pdfDoc.numPages;
  if (totalPages === 0) {
    throw new Error('The PDF document contains 0 pages.');
  }

  const pages = [];
  let totalCharacters = 0;
  let totalWords = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      if (typeof onProgress === 'function') {
        const percentage = Math.round((pageNum / totalPages) * 100);
        onProgress({ current: pageNum, total: totalPages, percentage });
      }

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract string items and clean up whitespace
      const textItems = textContent.items
        .map((item) => (item.str ? item.str.trim() : ''))
        .filter(Boolean);

      const pageText = textItems.join(' ').replace(/\s+/g, ' ').trim();

      pages.push({
        pageNumber: pageNum,
        text: pageText,
        wordCount: pageText ? pageText.split(/\s+/).length : 0,
      });

      totalCharacters += pageText.length;
      totalWords += pageText ? pageText.split(/\s+/).length : 0;
    } catch (pageErr) {
      console.warn(`Error extracting page ${pageNum}:`, pageErr);
      pages.push({
        pageNumber: pageNum,
        text: '',
        wordCount: 0,
        error: 'Failed to extract text from this page.',
      });
    }
  }

  // Check if any readable text was extracted
  const hasText = pages.some((p) => p.text && p.text.trim().length > 0);
  if (!hasText) {
    throw new Error(
      'This PDF does not contain any selectable text. It appears to be a scanned image-only PDF or blank document. Please upload a PDF with readable text.'
    );
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    totalPages,
    pages,
    totalCharacters,
    totalWords,
  };
}
