'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import DocumentSidebar from '@/components/DocumentSidebar';
import ChatWindow from '@/components/ChatWindow';
import { chunkDocumentPages } from '@/lib/retrieval';
import { generateId } from '@/lib/utils';
import { useLocalStorage } from '@/lib/useStorage';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const router = useRouter();
  const [documentData] = useLocalStorage('active_pdf_document', null);
  const [messages, setMessages] = useLocalStorage('pdf_chat_history', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState(null);

  // Pre-chunk document pages for retrieval
  const documentChunks = useMemo(() => {
    if (!documentData || !documentData.pages) return [];
    return chunkDocumentPages(documentData.pages, 350, 50);
  }, [documentData]);

  // Handle asking a question
  const handleSendMessage = async (questionText) => {
    if (!questionText || !questionText.trim() || isLoading) return;

    setError(null);
    setLastFailedQuestion(null);

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: questionText.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare history formatted for API (exclude raw sources for context brevity)
      const apiHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText.trim(),
          chunks: documentChunks,
          history: apiHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.answer || "I couldn't find this information in the uploaded document.",
        sources: Array.isArray(data.sources) ? data.sources : [],
        timestamp: Date.now(),
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'An error occurred while connecting to the AI.');
      setLastFailedQuestion(questionText.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedQuestion) {
      handleSendMessage(lastFailedQuestion);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setMessages([]);
      setError(null);
    }
  };

  const handleNewDocument = () => {
    router.push('/');
  };

  // No document state: Prompt user to upload a document
  if (!documentData) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-900/50 shadow-sm">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">No Document Selected</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
            Please upload a PDF document first so the AI can extract and reference its contents.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Upload Page</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        documentName={documentData.fileName}
        onNewDocument={handleNewDocument}
        onClearChat={handleClearChat}
        hasMessages={messages.length > 0}
      />

      {/* Main Workspace: Sidebar + Chat Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Document Sidebar */}
        <DocumentSidebar
          documentData={documentData}
          onNewDocument={handleNewDocument}
          onClearChat={handleClearChat}
          onSelectQuestion={handleSendMessage}
          isProcessing={isLoading}
        />

        {/* Chat Stream & Input Area */}
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          error={error}
          onRetry={handleRetry}
          documentData={documentData}
        />
      </div>
    </div>
  );
}
