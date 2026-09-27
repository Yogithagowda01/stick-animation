import React from 'react';

export default function ResultPanel({ imageSrc, animation, onStartOver }) {
  if (!imageSrc) return null;

  const cssClass = animation?.cssClass || 'anim-idle';

  function handleDownload() {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'stick-figure-animated-scene.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="panel result-final">
      <h3>Your animated scene</h3>
      <div className="animated-frame">
        <img src={imageSrc} alt="Animated scene" className={`scene-image ${cssClass}`} />
      </div>
      {animation?.label && <p className="animation-caption">Animation: {animation.label}</p>}
      <div className="result-actions">
        <button type="button" onClick={handleDownload}>
          Download
        </button>
        <button type="button" className="primary-btn" onClick={onStartOver}>
          Start Over
        </button>
      </div>
    </div>
  );
}
