'use client';

import { Sparkles } from 'lucide-react';

const DEFAULT_QUESTIONS = [
  'Summarize this document.',
  'What are the main points?',
  'Explain this document in simple language.',
  'What are the important topics?',
  'What conclusions does the document make?',
];

export default function SuggestedQuestions({ onSelectQuestion, disabled = false, customQuestions }) {
  const questions = customQuestions && customQuestions.length > 0 ? customQuestions : DEFAULT_QUESTIONS;

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Suggested Questions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            disabled={disabled}
            className="text-left text-xs sm:text-sm px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
