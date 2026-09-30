export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, options?: { message?: string; details?: any }) {
    super(options?.message ?? code);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = 500;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  constructor(code: string, options?: { message?: string; details?: any }) {
    super(code, { message: options?.message, details: options?.details });
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, options?: { message?: string; details?: any }) {
    super(code, { message: options?.message, details: options?.details });
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ConflictError extends AppError {
  constructor(code: string, options?: { message?: string; details?: any }) {
    super(code, { message: options?.message, details: options?.details });
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
