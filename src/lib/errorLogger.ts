/**
 * Centralized error logging utility that only logs to console in development mode.
 * In production, errors are suppressed from the browser console to prevent
 * information leakage about internal system structure.
 */

type ErrorContext = string;

/**
 * Log an error only in development mode.
 * In production, this does nothing to prevent exposing internal details.
 */
export function logError(context: ErrorContext, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, errors could be sent to a server-side logging service
  // For now, we simply suppress console output
}

/**
 * Log a warning only in development mode.
 */
export function logWarning(context: ErrorContext, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message, data);
  }
}

/**
 * Log debug information only in development mode.
 */
export function logDebug(context: ErrorContext, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.log(`[${context}]`, message, data);
  }
}
