/**
 * Server-side OpenAI-compatible API client.
 *
 * The provider is configured through AI_BASE_URL, AI_MODEL, and AI_API_KEY so
 * the app is not tied to a single vendor.
 */
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-oss-20b';

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
 * Format conversation history and document context into OpenAI-compatible messages
 */
function buildMessages(history, currentQuestion, contextChunks) {
  const messages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];

  // Add conversation history turns (user and assistant)
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn.role === 'user' && turn.content) {
        messages.push({
          role: 'user',
          content: turn.content,
        });
      } else if (turn.role === 'assistant' && turn.content) {
        messages.push({
          role: 'assistant',
          content: typeof turn.content === 'string' ? turn.content : JSON.stringify(turn.content),
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

  messages.push({
    role: 'user',
    content: userPrompt,
  });

  return messages;
}

function parseAiResponse(rawText) {
  if (!rawText) {
    throw new Error('The AI provider returned an empty response. Please try again.');
  }

  try {
    const parsed = JSON.parse(rawText.trim());
    return {
      answer: parsed.answer || rawText,
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    return { answer: rawText, sources: [] };
  }
}

async function callAiEndpoint(baseUrl, modelName, apiKey, payload) {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
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

    const error = new Error(`AI provider error (${errorStatus}): ${errorMessage}`);
    error.status = errorStatus;
    error.details = parsedError;
    throw error;
  }

  return await response.json();
}

/**
 * Ask the configured AI provider a question grounded in the provided document chunks
 *
 * @param {Object} options
 * @param {string} options.question - User's question
 * @param {Array} options.contextChunks - Retrieved document chunks [{ pageNumber, text }]
 * @param {Array} [options.history=[]] - Past conversation messages
 * @param {string} [options.apiKey] - Optional override, defaults to process.env.AI_API_KEY
 * @returns {Promise<{ answer: string, sources: Array<{ page: number, text: string }> }>}
 */
export async function askGeminiDocument({ question, contextChunks, history = [], apiKey }) {
  const providerKey = apiKey || process.env.AI_API_KEY;

  if (!providerKey) {
    throw new Error(
      'AI_API_KEY is not configured. Add AI_API_KEY to your environment variables or .env.local file.'
    );
  }

  const messages = buildMessages(history, question, contextChunks);
  const payload = {
    model: AI_MODEL,
    messages,
    temperature: 0.2,
    top_p: 0.95,
    response_format: {
      type: 'json_object',
    },
    max_tokens: 2048,
  };

  const result = await callAiEndpoint(AI_BASE_URL, AI_MODEL, providerKey, payload);
  return parseAiResponse(result?.choices?.[0]?.message?.content);
}
