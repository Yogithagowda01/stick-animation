const express = require('express');
const { normalizeAction } = require('../middleware/validate');

const router = express.Router();

// Deterministic action -> CSS animation preset. No external API calls,
// so this endpoint essentially cannot fail beyond a malformed request body,
// and even then it degrades to a safe default instead of erroring.
const ANIMATION_PRESETS = {
  run: { cssClass: 'anim-run', durationMs: 900, loop: true, label: 'Running' },
  walk: { cssClass: 'anim-walk', durationMs: 1200, loop: true, label: 'Walking' },
  jump: { cssClass: 'anim-jump', durationMs: 800, loop: true, label: 'Jumping' },
  wave: { cssClass: 'anim-wave', durationMs: 1000, loop: true, label: 'Waving' },
  kick: { cssClass: 'anim-kick', durationMs: 700, loop: true, label: 'Kicking' },
  dance: { cssClass: 'anim-dance', durationMs: 1100, loop: true, label: 'Dancing' },
  idle: { cssClass: 'anim-idle', durationMs: 2000, loop: true, label: 'Idle' },
  other: { cssClass: 'anim-idle', durationMs: 2000, loop: true, label: 'Idle' },
};

// POST /api/animate  { action: "run" | "jump" | ... }
router.post('/', (req, res) => {
  const action = normalizeAction(req.body?.action);
  const preset = ANIMATION_PRESETS[action] || ANIMATION_PRESETS.idle;

  return res.json({
    ok: true,
    animation: { action, ...preset },
  });
});

module.exports = router;
