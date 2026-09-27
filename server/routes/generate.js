const express = require('express');
const { assertAllowedStyle, assertAnalysisShape } = require('../middleware/validate');
const { generateScene } = require('../services/gemini');

const router = express.Router();

// POST /api/generate  { analysis: {...from /api/analyze}, style: "cartoon" | "anime" | "pixel" }
router.post('/', async (req, res, next) => {
  try {
    const { analysis, style } = req.body || {};
    assertAnalysisShape(analysis);
    assertAllowedStyle(style);

    const result = await generateScene(analysis, style);
    return res.json({ ok: true, image: result.image, provider: result.provider });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
