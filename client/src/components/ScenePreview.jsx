import React from 'react';

export default function ScenePreview({ imageSrc }) {
  if (!imageSrc) return null;

  return (
    <div className="studio-card" style={{ textAlign: 'center' }}>
      <div className="card-header-bar">
        <div className="card-title-group">
          <span style={{ fontSize: '1.2rem' }}>🖼️</span>
          <h3>Generated Scene</h3>
        </div>
        <span className="card-badge live">Ready for Motion</span>
      </div>

      <div className="stage-presentation">
        <div className="scene-image-frame">
          <img src={imageSrc} alt="Generated scene preview" className="scene-image" />
        </div>
      </div>
    </div>
  );
}
