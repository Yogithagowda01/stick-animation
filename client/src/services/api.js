const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Normalizes every failure (network error, non-2xx response, bad JSON)
 * into the same { ok:false, code, message } shape so the UI only has to
 * handle one error format anywhere in the app.
 */
async function post(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: "We couldn't reach the server. Check your connection and try again.",
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      code: 'BAD_RESPONSE',
      message: 'The server sent back something unexpected. Please try again.',
    };
  }

  if (!response.ok || data.ok === false) {
    return {
      ok: false,
      code: data.code || `HTTP_${response.status}`,
      message: data.message || 'Something went wrong. Please try again.',
    };
  }

  return data;
}

export function analyzeDrawing(imageDataUrl) {
  return post('/api/analyze', { image: imageDataUrl });
}

export function generateScene(analysis, style) {
  return post('/api/generate', { analysis, style });
}

export function animateScene(action) {
  return post('/api/animate', { action });
}
