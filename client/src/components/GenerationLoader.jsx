import React, { useState, useEffect } from 'react';

const GENERATION_HINTS = [
  'Interpreting stick figure pose & proportions...',
  'Synthesizing full character anatomy & depth...',
  'Applying chosen art style, lighting & colors...',
  'Composing background scene & framing...',
  'Finalizing high-resolution illustration...',
];

export default function GenerationLoader({ stageLabel, subtext }) {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % GENERATION_HINTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="studio-card loader-card">
      <div className="magic-sparkle-ring">
        <div className="magic-spinner-circle" />
        <span className="magic-inner-icon">✨</span>
      </div>

      <div>
        <h3 className="loader-title">{stageLabel || 'Creating your scene...'}</h3>
        <p className="loader-subtitle" style={{ minHeight: '1.4em', transition: 'all 0.3s ease' }}>
          {subtext || GENERATION_HINTS[hintIndex]}
        </p>
      </div>

      <div className="pulse-bar-wrapper">
        <div className="pulse-bar-fill" />
      </div>

      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Powered by Gemini AI Vision & Image Synthesis
      </span>
    </div>
  );
}
