const { ValidationError } = require('../utils/errors');

// Hard ceiling on the raw (decoded) image size we accept.
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;
// A canvas with at least one mark will exceed this minimal threshold.
const MIN_IMAGE_BYTES = 50;

const ALLOWED_STYLES = ['cartoon', 'anime', 'pixel'];
const ALLOWED_ACTIONS = ['run', 'jump', 'wave', 'walk', 'kick', 'dance', 'idle', 'other'];

/**
 * Validates a `data:image/...;base64,...` string.
 * Returns the raw base64 payload (without the prefix), MIME type, and its byte size.
 * Handles whitespace, newlines, and various image formats safely.
 */
function parseImageDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new ValidationError('No drawing was received. Please draw something first.', 'EMPTY_CANVAS');
  }

  const trimmed = dataUrl.trim();
  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,([\s\S]+)$/);
  if (!match) {
    throw new ValidationError(
      'That image could not be read. Please try drawing again.',
      'INVALID_IMAGE_FORMAT'
    );
  }

  const rawFormat = match[1].toLowerCase();
  const allowedFormats = ['png', 'jpeg', 'jpg', 'webp'];
  if (!allowedFormats.includes(rawFormat)) {
    throw new ValidationError('Unsupported image format. Please use PNG, JPEG, or WebP.', 'INVALID_IMAGE_FORMAT');
  }

  // Clean any accidental whitespace or newlines inside base64 payload
  const base64 = match[2].replace(/\s+/g, '');
  const byteSize = Buffer.byteLength(base64, 'base64');

  if (byteSize < MIN_IMAGE_BYTES) {
    throw new ValidationError(
      'Looks like the canvas is empty. Draw something before analyzing.',
      'EMPTY_CANVAS'
    );
  }

  if (byteSize > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      'That drawing is too large. Try a simpler sketch or refresh the canvas.',
      'IMAGE_TOO_LARGE'
    );
  }

  const mimeType = `image/${rawFormat === 'jpg' ? 'jpeg' : rawFormat}`;
  return { base64, byteSize, mimeType };
}

function assertAllowedStyle(style) {
  if (!ALLOWED_STYLES.includes(style)) {
    throw new ValidationError(
      `Please choose one of the available styles: ${ALLOWED_STYLES.join(', ')}.`,
      'INVALID_STYLE'
    );
  }
}

function normalizeAction(action) {
  if (typeof action === 'string' && ALLOWED_ACTIONS.includes(action.toLowerCase())) {
    return action.toLowerCase();
  }
  return 'idle';
}

function assertAnalysisShape(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    throw new ValidationError(
      'Missing drawing analysis. Please analyze your drawing again.',
      'MISSING_ANALYSIS'
    );
  }
}

module.exports = {
  MAX_IMAGE_BYTES,
  MIN_IMAGE_BYTES,
  ALLOWED_STYLES,
  ALLOWED_ACTIONS,
  parseImageDataUrl,
  assertAllowedStyle,
  normalizeAction,
  assertAnalysisShape,
};
