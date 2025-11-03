/**
 * Enhanced error handling utilities with retry logic
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: (error) => {
    // Don't retry on client errors (4xx)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    // Retry on network errors and server errors (5xx)
    return true;
  },
};

/**
 * Exponential backoff delay calculation
 */
export function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async functions
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If this is the last attempt, throw the error
      if (attempt > finalConfig.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (finalConfig.retryCondition && !finalConfig.retryCondition(error)) {
        break;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, finalConfig);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, errorMessage);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Enhanced error class with context
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly context: Record<string, any>;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code = 'UNKNOWN_ERROR',
    status = 500,
    context: Record<string, any> = {},
    retryable = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.context = context;
    this.retryable = retryable;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      context: this.context,
      retryable: this.retryable,
      stack: this.stack,
    };
  }
}

/**
 * HTTP error handler
 */
export function handleHttpError(response: Response): AppError {
  const isClientError = response.status >= 400 && response.status < 500;
  const isServerError = response.status >= 500;

  let code = 'HTTP_ERROR';
  let retryable = false;

  if (isClientError) {
    code = 'CLIENT_ERROR';
    retryable = false;
  } else if (isServerError) {
    code = 'SERVER_ERROR';
    retryable = true;
  }

  return new AppError(
    `HTTP ${response.status}: ${response.statusText}`,
    code,
    response.status,
    { url: response.url },
    retryable
  );
}

/**
 * Network error handler
 */
export function handleNetworkError(error: any): AppError {
  if (error.name === 'AbortError') {
    return new AppError(
      'Request was aborted',
      'REQUEST_ABORTED',
      0,
      {},
      false
    );
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new AppError(
      'Network connection failed',
      'NETWORK_ERROR',
      0,
      { originalError: error.message },
      true
    );
  }

  return new AppError(
    error.message || 'Unknown network error',
    'UNKNOWN_NETWORK_ERROR',
    0,
    { originalError: error },
    true
  );
}

/**
 * Enhanced fetch with retry and better error handling
 */
export async function enhancedFetch(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await withRetry(async () => {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw handleHttpError(res);
      }

      return res;
    }, retryConfig);

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw handleNetworkError(error);
  }
}

/**
 * Error boundary utilities for React
 */
export function logError(error: Error, errorInfo?: any) {
  console.error('Application Error:', error);
  
  if (errorInfo) {
    console.error('Error Info:', errorInfo);
  }

  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: errorInfo });
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledrejection' }
      );
    });

    window.addEventListener('error', (event) => {
      logError(event.error, { 
        type: 'uncaughtException',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }
}
