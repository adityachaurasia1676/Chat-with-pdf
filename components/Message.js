'use client';

import { useState } from 'react';
import { Bot, User, Copy, Check, BookOpen, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { formatTime } from '@/lib/utils';

/**
 * Format simple markdown text (bold, lists, linebreaks) cleanly without heavy external packages
 */
function FormattedContent({ content }) {
  if (!content) return null;

  // Split content into lines
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm sm:text-base leading-relaxed break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Check for bullet list item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-indigo-500 font-bold select-none">•</span>
              <div>{renderInlineFormatting(listText)}</div>
            </div>
          );
        }

        // Check for numbered list item
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-indigo-500 font-semibold select-none min-w-[1.2rem]">
                {numberedMatch[1]}.
              </span>
              <div>{renderInlineFormatting(numberedMatch[2])}</div>
            </div>
          );
        }

        // Check for headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-semibold text-slate-900 dark:text-white mt-2">
              {renderInlineFormatting(trimmed.substring(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-bold text-slate-900 dark:text-white mt-3">
              {renderInlineFormatting(trimmed.replace(/^#+\s*/, ''))}
            </h3>
          );
        }

        // Regular paragraph
        return <p key={idx}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

/**
 * Render bold (**text**) and code (`text`) inline
 */
function renderInlineFormatting(text) {
  if (!text) return '';

  // Split by bold (**...**) and backtick (`...`) tokens
  const parts = [];
  let remaining = text;
  let keyIndex = 0;

  // Regex matches **bold** or `code`
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={keyIndex++} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={keyIndex++}
          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono text-indigo-600 dark:text-indigo-400"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function Message({ message }) {
  const { role, content, sources, timestamp } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const isNotFoundMessage =
    typeof content === 'string' &&
    content.toLowerCase().includes("couldn't find this information in the uploaded document");

  const hasSources = Array.isArray(sources) && sources.length > 0;

  return (
    <div
      className={`group flex items-start gap-3 py-3 px-2 sm:px-4 transition-colors ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs border ${
          isUser
            ? 'bg-slate-900 text-white border-slate-800 dark:bg-indigo-600 dark:border-indigo-500'
            : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3.5 shadow-2xs border ${
            isUser
              ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-xs'
              : isNotFoundMessage
              ? 'bg-amber-50/60 dark:bg-amber-950/20 text-slate-800 dark:text-slate-100 border-amber-200 dark:border-amber-900/50 rounded-tl-xs'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-tl-xs'
          }`}
        >
          {/* Missing info banner */}
          {isNotFoundMessage && !isUser && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 pb-2 border-b border-amber-200/60 dark:border-amber-900/40">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Not Found in Document</span>
            </div>
          )}

          {/* Message Content */}
          <FormattedContent content={content} />

          {/* Sources Section (for AI response) */}
          {!isUser && hasSources && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {sources.length} {sources.length === 1 ? 'Source Citation' : 'Source Citations'}
                </span>
                {showSources ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Collapsible Source Cards */}
              {showSources && (
                <div className="mt-2.5 space-y-2">
                  {sources.map((src, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          Page {src.page}
                        </span>
                      </div>
                      {src.text && (
                        <p className="text-slate-600 dark:text-slate-300 italic line-clamp-3">
                          &ldquo;{src.text}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp & Action Bar */}
        <div
          className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400 dark:text-slate-500 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span>{formatTime(timestamp)}</span>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Copy message"
              aria-label="Copy message"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3 h-3" /> Copied
                </span>
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
