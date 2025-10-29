// ==================== Error Types ====================
export enum ErrorCode {
  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_TRANSACTION_ERROR = 'DB_TRANSACTION_ERROR',

  // File system errors
  FS_NOT_FOUND = 'FS_NOT_FOUND',
  FS_PERMISSION_DENIED = 'FS_PERMISSION_DENIED',
  FS_READ_ERROR = 'FS_READ_ERROR',
  FS_WRITE_ERROR = 'FS_WRITE_ERROR',

  // Image processing errors
  IMG_UNSUPPORTED_FORMAT = 'IMG_UNSUPPORTED_FORMAT',
  IMG_THUMBNAIL_ERROR = 'IMG_THUMBNAIL_ERROR',
  IMG_EXIF_ERROR = 'IMG_EXIF_ERROR',

  // Scanning errors
  SCAN_CANCELLED = 'SCAN_CANCELLED',
  SCAN_ERROR = 'SCAN_ERROR',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ==================== Custom Error Class ====================
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
      originalError:
        process.env.NODE_ENV === 'development' && this.originalError
          ? {
              message: this.originalError.message,
              stack: this.originalError.stack,
            }
          : undefined,
    };
  }
}

// ==================== Error Factory Functions ====================
export function createDatabaseError(message: string, originalError?: Error, context?: Record<string, any>) {
  return new AppError(message, ErrorCode.DB_QUERY_ERROR, originalError, context);
}

export function createFileSystemError(
  message: string,
  code: ErrorCode = ErrorCode.FS_READ_ERROR,
  originalError?: Error,
  context?: Record<string, any>
) {
  return new AppError(message, code, originalError, context);
}

export function createImageProcessingError(message: string, originalError?: Error, context?: Record<string, any>) {
  return new AppError(message, ErrorCode.IMG_THUMBNAIL_ERROR, originalError, context);
}

export function createValidationError(message: string, context?: Record<string, any>) {
  return new AppError(message, ErrorCode.VALIDATION_ERROR, undefined, context);
}

// ==================== Error Handling Utilities ====================
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.UNKNOWN_ERROR, error, context);
  }

  if (typeof error === 'string') {
    return new AppError(error, ErrorCode.UNKNOWN_ERROR, undefined, context);
  }

  return new AppError('An unknown error occurred', ErrorCode.UNKNOWN_ERROR, undefined, {
    ...context,
    originalError: error,
  });
}

/**
 * Wraps an async function with error handling
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error, { function: fn.name, args, customMessage: errorMessage });
    }
  };
}


