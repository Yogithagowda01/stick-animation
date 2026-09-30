const { UpstreamError, RateLimitError } = require('../utils/errors');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Configurable Gemini models from .env with solid defaults
const RAW_VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3-flash-preview';
const RAW_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

// Normalize model names so 'models/gemini-...' does not become '.../models/models/...'
const VISION_MODEL = RAW_VISION_MODEL.replace(/^models\//, '');
const IMAGE_MODEL = RAW_IMAGE_MODEL.replace(/^models\//, '');

const REQUEST_TIMEOUT_MS = 30000;

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new UpstreamError(
      'The AI service is not configured. Please add GEMINI_API_KEY to your .env file.',
      'MISSING_API_KEY',
      500
    );
  }
  return key;
}

async function callGemini(model, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const cleanModel = model.replace(/^models\//, '');
  let response;
  try {
    response = await fetch(`${GEMINI_BASE_URL}/${cleanModel}:generateContent`, {
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
    console.error(`Gemini ${cleanModel} error ${response.status}:`, details);
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

function extractAndParseJson(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return null;

  // Search candidate parts for text content, preferring non-thought parts
  const textParts = parts.filter((p) => typeof p.text === 'string' && !p.thought);
  const candidates = textParts.length ? textParts : parts.filter((p) => typeof p.text === 'string');

  for (const part of candidates) {
    let text = part.text.trim();

    // Strip markdown JSON delimiters if present
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    text = text.trim();

    // Attempt direct parse
    try {
      return JSON.parse(text);
    } catch {
      // Find outermost JSON object if surrounded by preamble/postamble
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch {
          // continue loop
        }
      }
    }
  }

  return null;
}

async function analyzeDrawing(base64Image, mimeType) {
  const prompt = `You are looking at a hand-drawn sketch (typically a stick figure and optional objects).
Analyze the drawing carefully:
1. "recognized": true if you see a figure, person, stick figure, or recognizable scene; false ONLY if it's completely empty or meaningless scribbles.
2. "description": One concise, clear sentence describing the character and scene.
3. "characterCount": Integer count of distinct characters/figures (default 1).
4. "pose": Brief phrase describing character pose (e.g. "standing with arms raised", "running forward", "kicking").
5. "action": Choose exactly ONE best matching action from: 'run', 'jump', 'wave', 'walk', 'kick', 'dance', 'idle', 'other'.
6. "objects": Array of distinct items/props detected (e.g. ["ball", "sun"]). Empty array if none.`;

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
      temperature: 0.2,
    },
  };

  let data;
  try {
    data = await callGemini(VISION_MODEL, body);
  } catch (visionErr) {
    // If preview model encounters quota/model error, try stable gemini-2.5-flash fallback
    if (VISION_MODEL !== 'gemini-2.5-flash') {
      console.warn(`Primary vision model ${VISION_MODEL} failed, trying gemini-2.5-flash:`, visionErr.message);
      data = await callGemini('gemini-2.5-flash', body);
    } else {
      throw visionErr;
    }
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const parsed = extractAndParseJson(parts);

  if (!parsed) {
    throw new UpstreamError(
      "We couldn't understand this drawing. Try drawing a clearer stick figure.",
      'INVALID_AI_RESPONSE',
      502
    );
  }

  // Sanitize and ensure standard structure
  return {
    recognized: Boolean(parsed.recognized ?? true),
    description: parsed.description || 'A hand-drawn stick figure.',
    pose: parsed.pose || 'Standing',
    action: typeof parsed.action === 'string' ? parsed.action.toLowerCase() : 'idle',
    objects: Array.isArray(parsed.objects) ? parsed.objects : [],
    characterCount: Number.isInteger(parsed.characterCount) ? parsed.characterCount : 1,
  };
}

// --- 2. Image generation (with Pollinations fallback) -----------------------

const STYLE_PROMPTS = {
  cartoon: 'colorful, clean-lined 2D cartoon style, flat shading, friendly and playful, highly vibrant',
  anime: 'vibrant Japanese anime / manga art style, expressive linework, soft cel shading, detailed lighting',
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
