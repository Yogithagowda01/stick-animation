import React from 'react';

export default function ScenePreview({ imageSrc }) {
  if (!imageSrc) return null;
  return (
    <div className="panel scene-preview">
      <img src={imageSrc} alt="Generated scene" className="scene-image" />
    </div>
  );
}
