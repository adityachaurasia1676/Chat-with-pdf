/**
 * Document Retrieval & Chunking Utility
 * Implements sliding-window chunking and TF-IDF / keyword-based context retrieval.
 */

// Common English stop words to filter out for better keyword matching
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves', 'tell', 'give', 'please'
]);

/**
 * Split text from pages into manageable chunks with page attribution
 * @param {Array<{ pageNumber: number, text: string }>} pages
 * @param {number} [targetChunkWords=350] - Target words per chunk
 * @param {number} [overlapWords=50] - Overlapping words between chunks
 * @returns {Array<{ id: string, pageNumber: number, chunkIndex: number, text: string, wordCount: number }>}
 */
export function chunkDocumentPages(pages, targetChunkWords = 350, overlapWords = 50) {
  if (!pages || !Array.isArray(pages)) return [];

  const chunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageText = (page.text || '').trim();
    if (!pageText) continue;

    const words = pageText.split(/\s+/).filter(Boolean);

    // If the page is short enough, keep it as a single chunk
    if (words.length <= targetChunkWords) {
      chunks.push({
        id: `p${page.pageNumber}-c0`,
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex++,
        text: pageText,
        wordCount: words.length,
      });
      continue;
    }

    // Otherwise split with sliding window and overlap
    let startIndex = 0;
    let pageChunkNum = 0;

    while (startIndex < words.length) {
      const endIndex = Math.min(startIndex + targetChunkWords, words.length);
      const chunkWords = words.slice(startIndex, endIndex);
      const chunkText = chunkWords.join(' ');

      chunks.push({
        id: `p${page.pageNumber}-c${pageChunkNum++}`,
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex++,
        text: chunkText,
        wordCount: chunkWords.length,
      });

      // Advance by (targetChunkWords - overlapWords)
      if (endIndex >= words.length) {
        break;
      }
      startIndex += Math.max(1, targetChunkWords - overlapWords);
    }
  }

  return chunks;
}

/**
 * Extract clean, lowercased query keywords filtering out stop words
 * @param {string} query
 * @returns {string[]}
 */
export function extractKeywords(query) {
  if (!query) return [];
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Check if the user query is asking for a general document overview/summary
 * @param {string} query
 * @returns {boolean}
 */
export function isBroadSummaryQuery(query) {
  const q = query.toLowerCase();
  const summaryTriggers = [
    'summarize',
    'summary',
    'main point',
    'main points',
    'overview',
    'about',
    'what is this document',
    'explain this document',
    'key takeaway',
    'important topic',
    'conclusion'
  ];
  return summaryTriggers.some((t) => q.includes(t));
}

/**
 * Retrieve the most relevant chunks for a given user query
 * Uses keyword matching, TF-IDF scoring, and query intent detection.
 *
 * @param {Array<{ id: string, pageNumber: number, text: string }>} chunks
 * @param {string} query
 * @param {number} [maxChunks=6]
 * @param {number} [maxCharsBudget=12000]
 * @returns {Array<{ id: string, pageNumber: number, text: string, score: number }>}
 */
export function retrieveRelevantChunks(chunks, query, maxChunks = 6, maxCharsBudget = 12000) {
  if (!chunks || chunks.length === 0) return [];
  if (!query || !query.trim()) return chunks.slice(0, maxChunks);

  // If the total chunks are small (under context budget), return all of them
  const totalChars = chunks.reduce((acc, c) => acc + (c.text?.length || 0), 0);
  if (totalChars <= maxCharsBudget) {
    return chunks;
  }

  const keywords = extractKeywords(query);
  const normalizedQuery = query.toLowerCase().trim();
  const isSummary = isBroadSummaryQuery(query);

  // Calculate Inverse Document Frequency (IDF) for keywords
  const idf = {};
  for (const kw of keywords) {
    const docFreq = chunks.filter((c) => c.text.toLowerCase().includes(kw)).length;
    idf[kw] = docFreq > 0 ? Math.log(1 + chunks.length / docFreq) : 0;
  }

  // Score each chunk
  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    let matchedKeywords = 0;

    for (const kw of keywords) {
      if (chunkLower.includes(kw)) {
        matchedKeywords++;
        // Count term frequency occurrences
        const count = (chunkLower.match(new RegExp(`\\b${kw}\\b`, 'g')) || []).length || 1;
        score += count * (idf[kw] || 1);
      }
    }

    // Bonus for matching multiple distinct keywords
    if (matchedKeywords > 1) {
      score *= Math.pow(1.4, matchedKeywords);
    }

    // High bonus for exact sub-phrase match
    if (normalizedQuery.length > 5 && chunkLower.includes(normalizedQuery)) {
      score += 50;
    }

    return {
      ...chunk,
      score,
    };
  });

  // If query is broad summary and no strong keyword matches, provide representative spread
  if (isSummary) {
    // If top score is low, sample beginning, middle, and end chunks
    const maxScore = Math.max(...scoredChunks.map((c) => c.score));
    if (maxScore < 2) {
      const selected = [];
      const total = chunks.length;

      // Pick first 2 chunks
      if (total > 0) selected.push(chunks[0]);
      if (total > 1) selected.push(chunks[1]);

      // Pick middle chunk
      if (total > 3) {
        selected.push(chunks[Math.floor(total / 2)]);
      }

      // Pick final chunk
      if (total > 2) {
        selected.push(chunks[total - 1]);
      }

      return selected;
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Take top chunks respecting maxChunks and character budget
  const selectedChunks = [];
  let currentChars = 0;

  for (const chunk of scoredChunks) {
    if (selectedChunks.length >= maxChunks) break;
    if (chunk.score <= 0 && selectedChunks.length >= 2) break;

    const chunkLen = chunk.text.length;
    if (currentChars + chunkLen > maxCharsBudget && selectedChunks.length > 0) {
      continue;
    }

    selectedChunks.push(chunk);
    currentChars += chunkLen;
  }

  // Fallback: If no keywords matched at all, provide first few chunks
  if (selectedChunks.length === 0) {
    return chunks.slice(0, Math.min(3, chunks.length));
  }

  // Sort selected chunks back by page number for coherent reading flow
  return selectedChunks.sort((a, b) => a.pageNumber - b.pageNumber);
}
