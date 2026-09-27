const express = require('express');
const { parseImageDataUrl } = require('../middleware/validate');
const { analyzeDrawing } = require('../services/gemini');

const router = express.Router();

// POST /api/analyze  { image: "data:image/png;base64,..." }
router.post('/', async (req, res, next) => {
  try {
    const { base64, mimeType } = parseImageDataUrl(req.body?.image);

    const analysis = await analyzeDrawing(base64, mimeType);

    if (!analysis.recognized) {
      // Not an error: the request succeeded, the model just couldn't make
      // sense of the sketch. Let the client show a friendly retry prompt.
      return res.json({
        ok: true,
        recognized: false,
        message: "We couldn't understand this drawing. Try drawing a clearer stick figure.",
      });
    }

    return res.json({ ok: true, recognized: true, analysis });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
