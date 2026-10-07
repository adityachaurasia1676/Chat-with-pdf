/**
 * Format raw bytes into human-readable strings (e.g. 1.2 MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis if it exceeds maxLength
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Generate a unique random ID for chat messages
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Estimate word count of a text string
 */
export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Format a timestamp into human-readable time (e.g. 11:45 AM)
 */
export function formatTime(date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
