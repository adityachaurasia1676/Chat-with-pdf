'use client';

import { FileText, PlusCircle, Trash2, Github, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Navbar({
  documentName,
  onNewDocument,
  onClearChat,
  hasMessages = false,
}) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white text-base sm:text-lg group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight">Chat with Your PDF</span>
            <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
              Document AI Assistant
            </span>
          </div>
        </Link>

        {/* Center: Current Document Badge (if loaded) */}
        {documentName && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 max-w-sm truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-500 dark:text-slate-400">Active Document:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
              {documentName}
            </span>
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {documentName && (
            <>
              {hasMessages && onClearChat && (
                <button
                  type="button"
                  onClick={onClearChat}
                  title="Clear conversation history"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              )}

              {onNewDocument && (
                <button
                  type="button"
                  onClick={onNewDocument}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New PDF</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
