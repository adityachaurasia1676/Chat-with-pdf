/**
 * Server-Side Gemini API Client
 * Securely calls Google Generative AI REST API with document-grounded system instructions.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Default model to use (gemini-2.5-flash with fallback to gemini-1.5-flash)
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

const SYSTEM_INSTRUCTION = `You are a document question-answering assistant for "Chat with Your PDF".
Your job is to answer the user's question accurately using ONLY the information contained in the provided PDF document excerpts.

Strict rules:
1. Grounding: Answer using only the provided excerpts. Do NOT hallucinate or bring in external knowledge not present in the document.
2. Missing Information: If the answer cannot be found in the provided excerpts, clearly state:
   "I couldn't find this information in the uploaded document."
   Do not guess, speculate, or invent facts.
3. Citations: When an answer is found, cite the specific page number(s) where the facts are located.
4. Formatting: Keep your explanation clear, well-structured, and helpful. Use bullet points or numbered lists where suitable for clarity.
5. Conversation History: Use prior chat turns for understanding follow-up questions (e.g. "What else did it say about that?"), but still require document backing for all facts.

Output format:
You MUST respond in valid JSON with this exact schema:
{
  "answer": "Your clear, accurate answer here...",
  "sources": [
    {
      "page": 1,
      "text": "Exact short excerpt or quote from the page supporting the statement"
    }
  ]
}
If the information is not found in the document, return:
{
  "answer": "I couldn't find this information in the uploaded document.",
  "sources": []
}`;

/**
 * Format conversation history and document context into Gemini contents array
 */
function buildGeminiContents(history, currentQuestion, contextChunks) {
  const contents = [];

  // Add conversation history turns (user and assistant)
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn.role === 'user' && turn.content) {
        contents.push({
          role: 'user',
          parts: [{ text: turn.content }],
        });
      } else if (turn.role === 'assistant' && turn.content) {
        contents.push({
          role: 'model',
          parts: [{ text: typeof turn.content === 'string' ? turn.content : JSON.stringify(turn.content) }],
        });
      }
    }
  }

  // Format context chunks with page numbers
  const formattedContext = contextChunks
    .map(
      (chunk, index) =>
        `--- EXCERPT ${index + 1} (Page ${chunk.pageNumber}) ---\n${chunk.text}\n`
    )
    .join('\n');

  const userPrompt = `DOCUMENT EXCERPTS:\n${formattedContext}\n\nUSER QUESTION:\n${currentQuestion}`;

  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }],
  });

  return contents;
}

/**
 * Call Gemini API endpoint
 */
async function callGeminiEndpoint(modelName, apiKey, payload) {
  const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorBody);
    } catch {
      parsedError = { error: { message: errorBody } };
    }

    const errorStatus = response.status;
    const errorMessage = parsedError?.error?.message || response.statusText;

    const error = new Error(`Gemini API error (${errorStatus}): ${errorMessage}`);
    error.status = errorStatus;
    error.details = parsedError;
    throw error;
  }

  return await response.json();
}

/**
 * Ask Gemini a question grounded in the provided document chunks
 *
 * @param {Object} options
 * @param {string} options.question - User's question
 * @param {Array} options.contextChunks - Retrieved document chunks [{ pageNumber, text }]
 * @param {Array} [options.history=[]] - Past conversation messages
 * @param {string} [options.apiKey] - Optional override, defaults to process.env.GEMINI_API_KEY
 * @returns {Promise<{ answer: string, sources: Array<{ page: number, text: string }> }>}
 */
export async function askGeminiDocument({ question, contextChunks, history = [], apiKey }) {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your environment variables or .env.local file.'
    );
  }

  const contents = buildGeminiContents(history, question, contextChunks);

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      response_mime_type: 'application/json',
    },
  };

  let result;
  try {
    // Attempt with primary model
    result = await callGeminiEndpoint(PRIMARY_MODEL, key, payload);
  } catch (err) {
    // If primary model not found (404) or unavailable, fallback to gemini-1.5-flash
    if (err.status === 404 || err.message?.includes('not found')) {
      console.warn(`Primary model ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}...`);
      result = await callGeminiEndpoint(FALLBACK_MODEL, key, payload);
    } else {
      throw err;
    }
  }

  // Parse candidate text from Gemini response
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try rephrasing your question.');
  }

  // Parse structured JSON response
  try {
    const parsed = JSON.parse(rawText.trim());
    return {
      answer: parsed.answer || rawText,
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch (jsonErr) {
    console.warn('Could not parse Gemini JSON response, extracting fallback:', jsonErr);
    // Fallback: extract text and try to map any page numbers mentioned
    return {
      answer: rawText,
      sources: [],
    };
  }
}
