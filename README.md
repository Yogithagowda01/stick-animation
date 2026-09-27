# Stick Figure → Animated Scene

Draw a simple stick figure or scene → AI understands the pose, action and
objects → pick a style → AI generates a polished scene → it gets animated.
No custom model training, no login, no database.

This is **Phase 1: a complete, working MVP** you can run locally.

## Tech stack (from the PRD/TRD)

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Drawing | react-sketch-canvas |
| Backend | Node.js + Express (separate from the client, per this repo's structure) |
| AI vision | Google Gemini API — `gemini-3-flash-preview` |
| Image generation | Google Gemini API — `gemini-3.1-flash-image-preview` ("Nano Banana 2"), with a keyless **Pollinations.ai** fallback if Gemini is unavailable |
| Animation | Plain CSS keyframes (no extra animation library needed) |
| Storage | None — drawings are processed in memory only, never saved to disk |

### A note on the Gemini model names

Gemini model names change often. As of this build (Sep 2026):
- `gemini-2.5-flash`, `gemini-2.5-pro`, and `gemini-2.5-flash-image` are all
  scheduled to shut down in **October 2026** — too soon to build a new
  project on.
- This project instead uses the current **Gemini 3** line: `gemini-3-flash-preview`
  for understanding the sketch, and `gemini-3.1-flash-image-preview`
  ("Nano Banana 2") for generating the styled scene.
- Both model names are **environment variables** (`GEMINI_VISION_MODEL`,
  `GEMINI_IMAGE_MODEL` in `.env`), so if Google renames or retires a model
  again, you only need to update `.env` — no code changes.
- Always double-check current model availability and free-tier limits at
  <https://ai.google.dev/gemini-api/docs/models> before relying on this
  in a live demo.

## Project structure

```
stick-figure-animation/
├── client/                  React app (Vite)
│   └── src/
│       ├── components/      DrawingCanvas, DrawingToolbar, AnalysisPanel,
│       │                    SceneOptions, GenerationLoader, ScenePreview,
│       │                    ResultPanel
│       ├── services/api.js  All backend calls + error normalization
│       ├── animations.css   CSS keyframes for each action
│       └── App.jsx          The draw → analyze → generate → animate flow
│
├── server/                  Express API (the ONLY place the API key lives)
│   ├── routes/               analyze.js, generate.js, animate.js
│   ├── services/gemini.js    All Gemini calls + Pollinations fallback
│   ├── middleware/           request validation + central error handler
│   └── server.js
│
├── .env.example
└── README.md
```

## Setup

**Requirements:** Node.js 18 or newer (uses the built-in `fetch`).

```bash
# 1. Install dependencies for both client and server
npm run install-all

# 2. Configure your API key
cp .env.example server/.env
# then open server/.env and paste your key from https://aistudio.google.com/apikey

# 3. Run both client and server together
npm run dev
```

- Client: <http://localhost:5173>
- Server: <http://localhost:5000> (health check at `/api/health`)

If you'd rather run them separately: `npm run dev:server` and `npm run dev:client`
in two terminals.

## How it works (the AI pipeline)

1. **Draw** — the canvas is exported as a PNG on the client. Nothing is sent
   to the server until you click **Analyze Drawing**.
2. **Analyze** (`POST /api/analyze`) — the PNG goes to Gemini's vision model
   with a strict JSON schema (`recognized`, `description`, `pose`, `action`,
   `objects`). If the sketch is too unclear, `recognized: false` comes back
   and the user gets a friendly retry prompt — not an error page.
3. **Generate** (`POST /api/generate`) — the structured analysis + chosen
   style are turned into an image-generation prompt for Nano Banana 2. If
   that call fails or is rate-limited, the server automatically retries
   with the free Pollinations.ai API before giving up.
4. **Animate** (`POST /api/animate`) — a plain lookup table maps the
   detected `action` to a CSS animation class. No AI call, so this step is
   effectively unable to fail (an unrecognized action just defaults to a
   gentle idle animation).

Throughout, the UI always shows one of the four pipeline states so the user
never sees a blank screen:

```
Analyzing your drawing...
       ↓
Understanding the pose...
       ↓
Creating your scene...
       ↓
Bringing it to life...
```

## Error handling

| Situation | Behavior |
|---|---|
| Empty canvas | Caught client-side before any request is sent |
| Invalid/unclear drawing | Gemini returns `recognized:false` → friendly retry message |
| Gemini API failure / network / timeout | Caught server-side → friendly "try again" message, never a stack trace |
| Invalid AI response (bad JSON) | Caught and converted to the same friendly message |
| Image generation unavailable | Automatic fallback to Pollinations.ai; only shows an error if both fail |
| Rate limit (from Gemini, or our own limiter) | 429 with a clear "please wait" message |
| Animation failure | Silently defaults to an idle animation — never blocks the final step |
| Client-side network failure | `services/api.js` catches every `fetch` failure and normalizes it |

## Security

- `GEMINI_API_KEY` lives only in `server/.env` and is **never** sent to the
  browser or referenced in any client code.
- All requests are validated on the server (image format, size, allowed
  style/action values) regardless of what the client sends.
- Image payloads are capped at 3 MB (raw) / 4.5 MB (request body) to
  prevent abuse.
- Basic per-IP rate limiting via `express-rate-limit` (60 requests / 15 min
  generally, 15 / 15 min on the more expensive `/api/generate`).
- No authentication, no database, no permanent storage of drawings —
  everything is processed in memory for the duration of a single request.

## What's intentionally NOT in this MVP

Per the PRD, these are future phases, not missing bugs:
- Multiple characters / AI-generated backgrounds
- Voice-prompt input
- Real AI video-generation export
- Accounts, saved gallery, sharing, or any database

## Next phases

1. **Phase 1 (this repo):** working local MVP — draw, analyze, generate, animate.
2. **Phase 2:** polish UI/UX, add more style presets, better mobile support.
3. **Phase 3:** deploy (client → Vercel/Netlify, server → Render/Railway/Fly.io).
4. **Phase 4:** optional upgrades — saved gallery (would introduce a database),
   multi-character scenes, real AI video export.
