import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) {
      fields[issue.path.join('.')] = issue.message;
    }
    console.warn('⚠️ Zod Validation Failed:', fields);
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Validation failed',
      fields,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      timestamp: new Date().toISOString(),
      status: err.status,
      error: err.message,
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'File too large',
    });
  }

  // Handle unique constraint violations
  if (err.code === '23505') {
    return res.status(409).json({
      timestamp: new Date().toISOString(),
      status: 409,
      error: 'Conflict: Resource already exists',
    });
  }

  // Handle foreign key constraint violations
  if (err.code === '23503') {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Resource references an invalid entity',
    });
  }

  console.error('Unhandled system error:', err);

  res.status(500).json({
    timestamp: new Date().toISOString(),
    status: 500,
    error: 'Internal server error',
    ...(!isProduction ? { message: err.message, stack: err.stack } : {}),
  });
}
