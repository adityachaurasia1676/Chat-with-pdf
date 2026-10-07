'use client';

import { FileText, Layers, Hash, HardDrive, PlusCircle, Trash2, HelpCircle } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import SuggestedQuestions from './SuggestedQuestions';

export default function DocumentSidebar({
  documentData,
  onNewDocument,
  onClearChat,
  onSelectQuestion,
  isProcessing = false,
}) {
  if (!documentData) return null;

  const { fileName, fileSize, totalPages, totalWords } = documentData;

  return (
    <aside className="w-full md:w-80 shrink-0 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* Document Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate" title={fileName}>
                {fileName}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Ready for AI chat
              </span>
            </div>
          </div>

          {/* Quick Document Stats */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatBytes(fileSize)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 col-span-2">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>~{totalWords?.toLocaleString() || 0} extracted words</span>
            </div>
          </div>
        </div>

        {/* Suggested Questions in Sidebar */}
        <div className="pt-1">
          <SuggestedQuestions
            onSelectQuestion={onSelectQuestion}
            disabled={isProcessing}
          />
        </div>

        {/* Viva / How it Works Note */}
        <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How Grounding Works</span>
          </div>
          <p className="leading-relaxed">
            The system retrieves relevant text chunks from the PDF and provides them to Gemini. Answers strictly cite facts from your document.
          </p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={onNewDocument}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs sm:text-sm font-medium transition-colors shadow-2xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Another PDF</span>
        </button>

        <button
          type="button"
          onClick={onClearChat}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-slate-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Conversation</span>
        </button>
      </div>
    </aside>
  );
}
