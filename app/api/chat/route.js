import { NextResponse } from 'next/server';
import { askGeminiDocument } from '@/lib/gemini';
import { retrieveRelevantChunks } from '@/lib/retrieval';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { question, chunks, pages, history = [] } = body || {};

    // Validate user question
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json(
        { error: 'Please enter a valid, non-empty question.' },
        { status: 400 }
      );
    }

    // Determine available context chunks
    let availableChunks = [];
    if (Array.isArray(chunks) && chunks.length > 0) {
      availableChunks = chunks;
    } else if (Array.isArray(pages) && pages.length > 0) {
      // Fallback: convert pages to chunks
      availableChunks = pages.map((p) => ({
        id: `p${p.pageNumber}`,
        pageNumber: p.pageNumber,
        text: p.text,
      }));
    }

    if (availableChunks.length === 0) {
      return NextResponse.json(
        {
          error:
            'No readable document context was provided. Please upload a PDF before asking questions.',
        },
        { status: 400 }
      );
    }

    // Retrieve most relevant chunks for this specific question
    const relevantChunks = retrieveRelevantChunks(availableChunks, question.trim());

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find this information in the uploaded document.",
        sources: [],
      });
    }

    // Call Gemini API securely
    const response = await askGeminiDocument({
      question: question.trim(),
      contextChunks: relevantChunks,
      history,
    });

    return NextResponse.json({
      answer: response.answer,
      sources: response.sources || [],
    });
  } catch (err) {
    console.error('Error in /api/chat route:', err);

    const errorMessage = err.message || 'Internal server error';
    let statusCode = 500;

    if (err.status === 429 || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate')) {
      statusCode = 429;
    } else if (err.status === 401 || err.status === 403 || errorMessage.toLowerCase().includes('api key')) {
      statusCode = 401;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: statusCode }
    );
  }
}
