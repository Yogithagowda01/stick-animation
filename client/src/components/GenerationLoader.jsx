import React from 'react';

/**
 * Covers the second half of the pipeline:
 *   "Creating your scene..." -> "Bringing it to life..."
 * The user should never see a blank screen while these calls are in flight.
 */
export default function GenerationLoader({ stageLabel }) {
  return (
    <div className="panel stage-panel">
      <div className="spinner" aria-hidden="true" />
      <p className="stage-text">{stageLabel}</p>
    </div>
  );
}
