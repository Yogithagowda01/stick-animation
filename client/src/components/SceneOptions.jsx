import React, { useState } from 'react';

const STYLES = [
  {
    id: 'cartoon',
    label: '2D Cartoon',
    tag: 'Popular',
    icon: '🎨',
    blurb: 'Vibrant, clean vector lines, flat shading, and playful storybook energy.',
  },
  {
    id: 'anime',
    label: 'Anime & Manga',
    tag: 'Cinematic',
    icon: '⚡',
    blurb: 'Expressive linework, dynamic lighting, and stylized Japanese animation aesthetic.',
  },
  {
    id: 'pixel',
    label: '16-Bit Pixel Art',
    tag: 'Retro Game',
    icon: '👾',
    blurb: 'Crisp nostalgic pixel grid, limited retro palette, and arcade game charm.',
  },
];

export default function SceneOptions({ onGenerate, analysis, onBack }) {
  const [selected, setSelected] = useState('cartoon');

  const currentStyleObj = STYLES.find((s) => s.id === selected) || STYLES[0];

  return (
    <div className="studio-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <span style={{ fontSize: '1.2rem' }}>🎭</span>
          <h3>Step 3: Select Art Style</h3>
        </div>
        <span className="card-badge">AI Scene Generation</span>
      </div>

      <div className="style-section-header">
        <p>Pick how the AI should render your stick figure sketch into a finished illustration.</p>
      </div>

      {/* Style Cards */}
      <div className="style-cards-grid" role="radiogroup" aria-label="Style selection">
        {STYLES.map((style) => (
          <div
            key={style.id}
            role="radio"
            aria-checked={selected === style.id}
            tabIndex={0}
            className={`style-card-btn ${selected === style.id ? 'active' : ''}`}
            onClick={() => setSelected(style.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(style.id);
              }
            }}
          >
            {style.tag && <span className="style-badge-tag">{style.tag}</span>}
            <span className="style-card-icon">{style.icon}</span>
            <span className="style-card-title">{style.label}</span>
            <span className="style-card-desc">{style.blurb}</span>
          </div>
        ))}
      </div>

      {/* Real-time Prompt Preview */}
      <div className="prompt-preview-box">
        <span>💡</span>
        <div>
          <span>AI Target: </span>
          <strong>{currentStyleObj.label}</strong>
          {analysis?.action ? ` illustrating dynamic ${analysis.action} movement` : ''}
          {analysis?.objects?.length ? ` with ${analysis.objects.join(', ')}` : ''}.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        {onBack && (
          <button type="button" className="ghost-btn" onClick={onBack}>
            &larr; Back to Analysis
          </button>
        )}
        <button
          type="button"
          className="primary-btn"
          style={{ marginLeft: onBack ? 'auto' : '0', width: onBack ? 'auto' : '100%' }}
          onClick={() => onGenerate(selected)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
          </svg>
          Generate Scene
        </button>
      </div>
    </div>
  );
}
