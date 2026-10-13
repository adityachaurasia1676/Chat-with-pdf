'use client';

import { useRouter } from 'next/navigation';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { useLocalStorage } from '@/lib/useStorage';

export default function HomePage() {
  const router = useRouter();
  const [savedDocument, setSavedDocument] = useLocalStorage('active_pdf_document', null);
  const [, setChatHistory] = useLocalStorage('pdf_chat_history', []);

  const handleUploadSuccess = (extractedDoc) => {
    setSavedDocument(extractedDoc);
    setChatHistory([]);
    router.push('/chat');
  };

  const handleResumeChat = () => {
    router.push('/chat');
  };

  const handleClearSaved = () => {
    setSavedDocument(null);
    setChatHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Document-Grounded Question Answering</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Chat with Your <span className="text-indigo-600 dark:text-indigo-400">PDF</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Upload any academic paper, report, or textbook and ask questions.
            Every answer is strictly backed by the document content and cites supporting page numbers.
          </p>
        </div>

        {/* Resume Previous Chat Banner if document exists in LocalStorage */}
        {savedDocument && (
          <div className="w-full max-w-xl mb-8 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block">
                  Previously Loaded Document
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate block">
                  {savedDocument.fileName} ({savedDocument.totalPages} pages)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResumeChat}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <span>Resume Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearSaved}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
                title="Dismiss and upload a new document"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <FileUpload onUploadSuccess={handleUploadSuccess} />

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
              Zero Hallucinations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              If an answer is not in the document, the model explicitly says so instead of guessing or making things up.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
              Page-by-Page Citations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Each response cites the exact page number and text snippet so you can verify the facts instantly.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
              Smart Context Retrieval
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Chunking and TF-IDF relevance ranking select the most pertinent sections for fast, token-efficient queries.
            </p>
          </div>
        </div>

        {/* How It Works for Viva / Project Explanation */}
        <div className="w-full max-w-4xl mt-12 p-6 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-2">
            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Project Architecture Overview (College Viva Ready)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                1. Text Extraction
              </span>
              <span>
                PDF.js extracts readable text page-by-page directly in the browser, bypassing server upload limits.
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                2. Sliding-Window Retrieval
              </span>
              <span>
                Text is partitioned into overlapping chunks with page metadata. Keyword scoring isolates top context passages.
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                3. Grounded Gemini Prompting
              </span>
              <span>
                A secure server route queries Gemini with strict grounding system instructions to return JSON citations.
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>Chat with Your PDF • Powered by Next.js & Google Gemini</p>
      </footer>
    </div>
  );
}
