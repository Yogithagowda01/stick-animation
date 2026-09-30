import React, { useState } from 'react';

const MOTION_PRESETS = [
  { id: 'anim-idle', label: 'Idle' },
  { id: 'anim-run', label: 'Run' },
  { id: 'anim-walk', label: 'Walk' },
  { id: 'anim-jump', label: 'Jump' },
  { id: 'anim-dance', label: 'Dance' },
  { id: 'anim-wave', label: 'Wave' },
  { id: 'anim-kick', label: 'Kick' },
];

export default function ResultPanel({
  imageSrc,
  sketchSrc,
  animation,
  onStartOver,
  onChangeStyle,
  onRegenerate,
}) {
  if (!imageSrc) return null;

  // Active motion class
  const initialClass = animation?.cssClass || 'anim-idle';
  const [currentMotion, setCurrentMotion] = useState(initialClass);
  const [isPaused, setIsPaused] = useState(false);

  // View mode: 'split' | 'ai' | 'sketch'
  const [viewMode, setViewMode] = useState(sketchSrc ? 'split' : 'ai');

  function handleDownload() {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `animsketch-${currentMotion}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const activeLabel = MOTION_PRESETS.find((m) => m.id === currentMotion)?.label || animation?.label || 'Active';

  return (
    <div className="studio-card result-showcase">
      {/* Header bar with view tabs */}
      <div className="showcase-header">
        <div className="card-title-group">
          <span style={{ fontSize: '1.25rem' }}>✨</span>
          <div>
            <h3>Your Animated AI Scene</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Motion: <strong>{activeLabel}</strong>
            </span>
          </div>
        </div>

        {sketchSrc && (
          <div className="view-mode-tabs" role="tablist" aria-label="Comparison view">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'ai' ? 'active' : ''}`}
              onClick={() => setViewMode('ai')}
            >
              AI Scene
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'sketch' ? 'active' : ''}`}
              onClick={() => setViewMode('sketch')}
            >
              Original Sketch
            </button>
          </div>
        )}
      </div>

      {/* Main Presentation Stage */}
      <div className={`stage-presentation ${viewMode === 'split' ? 'split-mode' : ''}`}>
        {/* Original Sketch (shown in split or sketch mode) */}
        {(viewMode === 'split' || viewMode === 'sketch') && sketchSrc && (
          <div className="stage-comparison-card">
            <span className="stage-card-tag">1. Hand-Drawn Sketch</span>
            <div className="scene-image-frame">
              <img src={sketchSrc} alt="Your initial hand-drawn sketch" className="sketch-preview-thumb" />
            </div>
          </div>
        )}

        {/* AI Animated Scene (shown in split or ai mode) */}
        {(viewMode === 'split' || viewMode === 'ai') && (
          <div className="stage-comparison-card">
            <span className="stage-card-tag ai-tag">2. AI Animated Illustration</span>
            <div className="scene-image-frame">
              <img
                src={imageSrc}
                alt="AI Generated Animated Scene"
                className={`scene-image ${currentMotion} ${isPaused ? 'anim-paused' : ''}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Animation Controller */}
      <div className="animation-controller-bar">
        <div className="controller-title-row">
          <span className="toolbar-label">Interactive Motions:</span>
          <button
            type="button"
            className="ghost-btn"
            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? '▶ Play Motion' : '⏸ Pause Motion'}
          </button>
        </div>

        <div className="motion-pills">
          {MOTION_PRESETS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`motion-pill-btn ${currentMotion === m.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentMotion(m.id);
                setIsPaused(false);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="result-actions-cluster">
        <div className="action-group-left">
          {onChangeStyle && (
            <button type="button" onClick={onChangeStyle} title="Change Art Style">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Change Style
            </button>
          )}

          {onRegenerate && (
            <button type="button" onClick={onRegenerate} title="Re-roll with current style">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/>
              </svg>
              Regenerate
            </button>
          )}
        </div>

        <div className="action-group-right">
          <button type="button" onClick={handleDownload} title="Download PNG artwork">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Scene
          </button>

          <button type="button" className="primary-btn" onClick={onStartOver}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Draw New Scene
          </button>
        </div>
      </div>
    </div>
  );
}
