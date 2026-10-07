'use client';

export default function Loading({ message = 'AI is analyzing your document...' }) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 max-w-3xl">
      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
        <svg
          className="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
        </svg>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium">{message}</span>
          <span className="inline-flex gap-1 items-center ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
