import React from 'react';

/**
 * Stage 2: AI Vision Understanding Card
 * Displays vision analysis insights, detected actions, objects, or friendly retry prompts.
 */
export default function AnalysisPanel({
  status,
  stageLabel,
  analysis,
  errorMessage,
  onRetry,
  onContinue,
  sketchImage,
}) {
  if (status === 'loading') {
    return (
      <div className="studio-card loader-card">
        <div className="magic-sparkle-ring">
          <div className="magic-spinner-circle" />
          <span className="magic-inner-icon">✨</span>
        </div>
        <div>
          <h3 className="loader-title">{stageLabel || 'Analyzing your drawing...'}</h3>
          <p className="loader-subtitle">Gemini Vision is interpreting your stick figure lines, pose, and action.</p>
        </div>
        <div className="pulse-bar-wrapper">
          <div className="pulse-bar-fill" />
        </div>
      </div>
    );
  }

  if (status === 'unrecognized') {
    return (
      <div className="studio-card error-card">
        <div className="error-icon">✏️</div>
        <div>
          <h3 className="error-title">Couldn't Recognize Character</h3>
          <p className="error-text">
            {errorMessage ||
              "We couldn't detect a clear figure or character pose. Try drawing a simple stick figure with a circle head, torso, arms, and legs."}
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={onRetry}>
          Try Drawing Again
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="studio-card error-card">
        <div className="error-icon">⚠️</div>
        <div>
          <h3 className="error-title">Analysis Issue</h3>
          <p className="error-text">{errorMessage || 'Something went wrong while analyzing your sketch.'}</p>
        </div>
        <button type="button" className="primary-btn" onClick={onRetry}>
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'success' && analysis) {
    return (
      <div className="studio-card analysis-card">
        <div className="card-header-bar">
          <div className="card-title-group">
            <span style={{ fontSize: '1.2rem' }}>✨</span>
            <h3>AI Understanding</h3>
          </div>
          <span className="card-badge live">Analysis Complete</span>
        </div>

        {/* AI Vision Insight Quote */}
        <div className="analysis-bubble">
          <div className="analysis-bubble-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            What AI Interpreted
          </div>
          <p className="analysis-quote">"{analysis.description}"</p>
        </div>

        {/* Key Extracted Properties */}
        <div className="facts-grid">
          <div className="fact-item">
            <div className="fact-label">Detected Pose</div>
            <div className="fact-value">{analysis.pose || 'Standard'}</div>
          </div>

          <div className="fact-item">
            <div className="fact-label">Action Movement</div>
            <div className="fact-value" style={{ color: '#4f46e5' }}>
              ⚡ {analysis.action || 'Idle'}
            </div>
          </div>

          {analysis.characterCount && (
            <div className="fact-item">
              <div className="fact-label">Characters</div>
              <div className="fact-value">{analysis.characterCount}</div>
            </div>
          )}
        </div>

        {/* Objects found */}
        {analysis.objects && analysis.objects.length > 0 && (
          <div>
            <span className="fact-label">Identified Elements & Props</span>
            <div className="objects-tag-list">
              {analysis.objects.map((obj, i) => (
                <span key={i} className="object-tag">
                  🎯 {obj}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Continue Action */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button type="button" className="primary-btn" style={{ flex: 1 }} onClick={onContinue}>
            Looks Great, Choose Art Style &rarr;
          </button>
        </div>
      </div>
    );
  }

  return null;
}
