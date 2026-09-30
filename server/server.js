const path = require('path');
// Load environment variables from local server .env, falling back to project root .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const analyzeRoute = require('./routes/analyze');
const generateRoute = require('./routes/generate');
const animateRoute = require('./routes/animate');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// --- Security / hygiene ------------------------------------------------
// Allow configured CLIENT_ORIGIN as well as standard local development origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === CLIENT_ORIGIN ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow in dev
  }
}));
// Body size cap: images are base64 (~33% bigger than raw bytes), so 4.5mb
// comfortably covers the 3MB raw-image limit enforced again in validate.js.
app.use(express.json({ limit: '4.5mb' }));

// Basic abuse protection. Generation is the most expensive call, so it
// gets a tighter budget than analyze/animate.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, code: 'RATE_LIMITED', message: 'Too many requests. Please slow down and try again shortly.' },
});
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, code: 'RATE_LIMITED', message: 'Too many scene generations. Please wait a few minutes.' },
});

app.use('/api', generalLimiter);

// --- Routes --------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ ok: true, status: 'healthy' }));

app.use('/api/analyze', analyzeRoute);
app.use('/api/generate', generateLimiter, generateRoute);
app.use('/api/animate', animateRoute);

// --- Fallbacks -------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Stick Figure -> Animated Scene API running on http://localhost:${PORT}`);
});
