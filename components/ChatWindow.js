'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import Message from './Message';
import Loading from './Loading';
import SuggestedQuestions from './SuggestedQuestions';

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  error,
  onRetry,
  documentData,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages update or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput('');
    onSendMessage(question);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSelectSuggested = (question) => {
    if (isLoading) return;
    onSendMessage(question);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden">
      {/* Scrollable Messages Stream */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center px-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 mb-4 shadow-2xs">
              <MessageSquare className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Ready to chat!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-md">
              Ask anything about <strong className="text-slate-800 dark:text-slate-100 font-semibold">{documentData?.fileName || 'your document'}</strong>.
              Answers are cited directly with supporting page numbers.
            </p>

            {/* Suggested Questions Grid */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs text-left">
              <SuggestedQuestions
                onSelectQuestion={handleSelectSuggested}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="max-w-4xl mx-auto space-y-3">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}

            {/* AI Thinking Indicator */}
            {isLoading && <Loading message="AI is reviewing document excerpts..." />}

            {/* Error Banner with Retry */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5">Request Failed</span>
                  <p className="text-xs sm:text-sm">{error}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200 text-xs font-medium transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Question</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Question Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={
                isLoading
                  ? 'Generating response...'
                  : 'Ask a question about this document...'
              }
              className="w-full pl-4 pr-14 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2.5 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-1">
            <span>Press Enter to send</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Document Grounded AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
