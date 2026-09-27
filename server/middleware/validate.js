const { ValidationError } = require('../utils/errors');

// Hard ceiling on the raw (decoded) image size we accept. Keeps memory/
// bandwidth bounded and blocks accidental multi-MB uploads.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB
// A sketch this small is almost certainly a blank/near-blank canvas.
const MIN_IMAGE_BYTES = 300;

const ALLOWED_STYLES = ['cartoon', 'anime', 'pixel'];
const ALLOWED_ACTIONS = ['run', 'jump', 'wave', 'walk', 'kick', 'dance', 'idle', 'other'];

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/;

/**
 * Validates a `data:image/...;base64,...` string.
 * Returns the raw base64 payload (without the prefix) and its byte size.
 * Throws ValidationError with a user-facing message on any problem.
 */
function parseImageDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new ValidationError('No drawing was received. Please draw something first.', 'EMPTY_CANVAS');
  }

  const match = dataUrl.match(DATA_URL_RE);
  if (!match) {
    throw new ValidationError(
      'That image could not be read. Please try drawing again.',
      'INVALID_IMAGE_FORMAT'
    );
  }

  const [, , base64] = match;
  const byteSize = Buffer.byteLength(base64, 'base64');

  if (byteSize < MIN_IMAGE_BYTES) {
    throw new ValidationError(
      "Looks like the canvas is empty. Draw something before analyzing.",
      'EMPTY_CANVAS'
    );
  }

  if (byteSize > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      'That drawing is too large. Try a simpler sketch or refresh the canvas.',
      'IMAGE_TOO_LARGE'
    );
  }

  return { base64, byteSize, mimeType: `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` };
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
  // Never hard-fail on animation: unknown/missing actions just fall back
  // to a safe default so the user is never blocked at the final step.
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
