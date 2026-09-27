import React from 'react';

/**
 * Covers the first half of the pipeline:
 *   "Analyzing your drawing..." -> "Understanding the pose..."
 * then reveals what the AI detected, or a friendly retry prompt if the
 * sketch couldn't be understood.
 */
export default function AnalysisPanel({ status, stageLabel, analysis, errorMessage, onRetry, onContinue }) {
  if (status === 'loading') {
    return (
      <div className="panel stage-panel">
        <div className="spinner" aria-hidden="true" />
        <p className="stage-text">{stageLabel}</p>
      </div>
    );
  }

  if (status === 'unrecognized') {
    return (
      <div className="panel error-panel">
        <p>{errorMessage || "We couldn't understand this drawing. Try drawing a clearer stick figure."}</p>
        <button type="button" className="primary-btn" onClick={onRetry}>
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="panel error-panel">
        <p>{errorMessage || 'Something went wrong analyzing your drawing.'}</p>
        <button type="button" className="primary-btn" onClick={onRetry}>
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'success' && analysis) {
    return (
      <div className="panel result-panel">
        <h3>Here's what we see</h3>
        <p className="analysis-description">{analysis.description}</p>
        <ul className="analysis-facts">
          <li>
            <strong>Pose:</strong> {analysis.pose}
          </li>
          <li>
            <strong>Action:</strong> {analysis.action}
          </li>
          {analysis.objects?.length > 0 && (
            <li>
              <strong>Objects:</strong> {analysis.objects.join(', ')}
            </li>
          )}
        </ul>
        <button type="button" className="primary-btn" onClick={onContinue}>
          Looks good, continue
        </button>
      </div>
    );
  }

  return null;
}
