import React, { useState } from 'react';

const STYLES = [
  { id: 'cartoon', label: 'Cartoon', blurb: 'Clean, colorful, playful' },
  { id: 'anime', label: 'Anime', blurb: 'Expressive, manga-inspired' },
  { id: 'pixel', label: 'Pixel Art', blurb: 'Retro 16-bit game look' },
];

export default function SceneOptions({ onGenerate }) {
  const [selected, setSelected] = useState('cartoon');

  return (
    <div className="panel scene-options">
      <h3>Choose a style</h3>
      <div className="style-grid">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`style-card ${selected === s.id ? 'active' : ''}`}
            onClick={() => setSelected(s.id)}
          >
            <span className="style-label">{s.label}</span>
            <span className="style-blurb">{s.blurb}</span>
          </button>
        ))}
      </div>
      <button type="button" className="primary-btn" onClick={() => onGenerate(selected)}>
        Generate Scene
      </button>
    </div>
  );
}
