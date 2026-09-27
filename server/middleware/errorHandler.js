/* eslint-disable no-unused-vars */
const { AppError } = require('../utils/errors');

/**
 * Last-resort safety net. Every route wraps its logic in try/catch and
 * calls next(err); this makes sure the client ALWAYS gets a clean JSON
 * error body instead of a stack trace, an HTML error page, or a hang.
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      // Log the real error server-side for debugging; never leak internals to the client.
      console.error(`[${err.code}]`, err.message);
    }
    return res.status(err.status).json({
      ok: false,
      code: err.code,
      message: err.friendlyMessage,
    });
  }

  // Unexpected/unknown error shape.
  console.error('Unhandled error:', err);
  return res.status(500).json({
    ok: false,
    code: 'INTERNAL_ERROR',
    message: 'Something unexpected happened on our end. Please try again.',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    code: 'NOT_FOUND',
    message: 'That endpoint does not exist.',
  });
}

module.exports = { errorHandler, notFoundHandler };
