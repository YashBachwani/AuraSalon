export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred',
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (statusCode >= 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json(payload);
}
