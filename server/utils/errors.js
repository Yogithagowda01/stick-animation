/**
 * Small set of typed errors so route handlers can decide the right
 * HTTP status + friendly message without parsing strings everywhere.
 */

class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', friendlyMessage } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    // Message shown to the end user. Falls back to a generic, safe sentence.
    this.friendlyMessage = friendlyMessage || 'Something went wrong. Please try again.';
  }
}

class ValidationError extends AppError {
  constructor(friendlyMessage, code = 'VALIDATION_ERROR') {
    super(friendlyMessage, { status: 400, code, friendlyMessage });
  }
}

class UpstreamError extends AppError {
  // Any failure talking to Google's Gemini API (network, 5xx, timeout).
  constructor(friendlyMessage, code = 'UPSTREAM_ERROR', status = 502) {
    super(friendlyMessage, { status, code, friendlyMessage });
  }
}

class RateLimitError extends AppError {
  constructor(friendlyMessage = 'Too many requests right now. Please wait a moment and try again.') {
    super(friendlyMessage, { status: 429, code: 'RATE_LIMITED', friendlyMessage });
  }
}

module.exports = { AppError, ValidationError, UpstreamError, RateLimitError };
