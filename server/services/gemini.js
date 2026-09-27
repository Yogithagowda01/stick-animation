const { UpstreamError, RateLimitError } = require('../utils/errors');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// --- Model names -----------------------------------------------------------
// Verified against ai.google.dev (Gemini API docs) as of Sep 2026.
// Gemini 2.5 Flash / 2.5 Flash Image are being retired (Oct 2026), so the
// MVP is built on the current Gemini 3 line instead. Both are overridable
// via .env in case Google renames/replaces a model again.
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3-flash-preview';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

const REQUEST_TIMEOUT_MS = 25000;

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new UpstreamError(
      'The AI service is not configured. Please contact the site administrator.',
      'MISSING_API_KEY',
      500
    );
  }
  return key;
}

async function callGemini(model, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': getApiKey(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new UpstreamError(
        'The AI service took too long to respond. Please try again.',
        'UPSTREAM_TIMEOUT',
        504
      );
    }
    throw new UpstreamError(
      "We couldn't reach the AI service. Check your connection and try again.",
      'UPSTREAM_NETWORK_ERROR',
      502
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new RateLimitError('The AI service is receiving too many requests. Please wait a moment and try again.');
  }

  if (!response.ok) {
    let details = '';
    try {
      details = JSON.stringify(await response.json());
    } catch {
      /* ignore body-parse failures */
    }
    console.error(`Gemini ${model} error ${response.status}:`, details);
    throw new UpstreamError(
      'The AI service could not process this request right now. Please try again shortly.',
      'UPSTREAM_ERROR',
      502
    );
  }

  return response.json();
}

// --- 1. Vision analysis -----------------------------------------------------

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    recognized: { type: 'boolean', description: 'False if the drawing is too unclear/abstract to interpret.' },
    description: { type: 'string', description: 'One short sentence describing the whole scene.' },
    characterCount: { type: 'integer' },
    pose: { type: 'string', description: 'Short phrase describing the main character pose.' },
    action: {
      type: 'string',
      enum: ['run', 'jump', 'wave', 'walk', 'kick', 'dance', 'idle', 'other'],
    },
    objects: { type: 'array', items: { type: 'string' } },
  },
  required: ['recognized', 'description', 'pose', 'action', 'objects'],
};

async function analyzeDrawing(base64Image, mimeType) {
  const prompt = `You are looking at a simple, possibly rough, hand-drawn sketch (likely a stick figure and/or a few objects). Identify:
- whether the sketch is clear enough to interpret at all ("recognized")
- a one-sentence description of what is drawn
- how many characters/figures are present
- the main character's pose in a few words
- the single best-matching action for the main character
- a short list of any distinct objects drawn (e.g. "ball", "tree", "sun")
If the sketch is just scribbles, a few disconnected lines, or otherwise not interpretable as a figure or scene, set recognized to false.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_SCHEMA,
      temperature: 0.4,
    },
  };

  const data = await callGemini(VISION_MODEL, body);

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string');
  if (!textPart) {
    throw new UpstreamError(
      "We couldn't understand this drawing. Try drawing a clearer stick figure.",
      'INVALID_AI_RESPONSE',
      502
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(textPart.text);
  } catch {
    throw new UpstreamError(
      "We couldn't understand this drawing. Try drawing a clearer stick figure.",
      'INVALID_AI_RESPONSE',
      502
    );
  }

  return parsed;
}

// --- 2. Image generation (with Pollinations fallback) -----------------------

const STYLE_PROMPTS = {
  cartoon: 'colorful, clean-lined 2D cartoon style, flat shading, friendly and playful',
  anime: 'vibrant Japanese anime / manga art style, expressive linework, soft cel shading',
  pixel: 'retro 16-bit pixel art style, crisp pixels, limited color palette, game-sprite look',
};

function buildScenePrompt(analysis, style) {
  const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;
  const objects = Array.isArray(analysis.objects) && analysis.objects.length
    ? ` The scene also includes: ${analysis.objects.join(', ')}.`
    : '';
  return (
    `A single polished illustration in a ${styleDesc}. ` +
    `Depict a character ${analysis.pose ? `in this pose: ${analysis.pose}` : ''}, performing the action: ${analysis.action}. ` +
    `${analysis.description || ''}${objects} ` +
    `Square composition, simple uncluttered background, the character clearly centered and fully visible.`
  );
}

async function generateSceneWithGemini(analysis, style) {
  const prompt = buildScenePrompt(analysis, style);
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  };

  const data = await callGemini(IMAGE_MODEL, body);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData || p.inline_data);
  const inline = imagePart?.inlineData || imagePart?.inline_data;

  if (!inline?.data) {
    throw new UpstreamError(
      'The AI could not create an image for this scene.',
      'NO_IMAGE_RETURNED',
      502
    );
  }

  const mime = inline.mimeType || inline.mime_type || 'image/png';
  return { image: `data:${mime};base64,${inline.data}`, provider: 'gemini' };
}

async function generateSceneWithPollinations(analysis, style) {
  // Keyless, free fallback so the demo still works if Gemini image
  // generation is rate-limited or briefly unavailable.
  const prompt = buildScenePrompt(analysis, style);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Pollinations responded ${res.status}`);
    return { image: url, provider: 'pollinations' };
  } finally {
    clearTimeout(timeout);
  }
}

async function generateScene(analysis, style) {
  try {
    return await generateSceneWithGemini(analysis, style);
  } catch (primaryErr) {
    console.warn('Primary image generation failed, trying fallback:', primaryErr.message);
    try {
      return await generateSceneWithPollinations(analysis, style);
    } catch (fallbackErr) {
      console.error('Fallback image generation also failed:', fallbackErr.message);
      throw new UpstreamError(
        "We couldn't create your scene right now. Please try again in a moment.",
        'IMAGE_GENERATION_UNAVAILABLE',
        502
      );
    }
  }
}

module.exports = { analyzeDrawing, generateScene, VISION_MODEL, IMAGE_MODEL };
