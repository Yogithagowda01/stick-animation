import React from 'react';

const PALETTE = [
  { hex: '#0f172a', label: 'Ink Black' },
  { hex: '#4f46e5', label: 'Electric Indigo' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#ea580c', label: 'Sunset Orange' },
  { hex: '#e11d48', label: 'Vibrant Rose' },
  { hex: '#0284c7', label: 'Ocean Blue' },
];

const BRUSH_PRESETS = [
  { size: 2, label: 'Fine' },
  { size: 4, label: 'Normal' },
  { size: 8, label: 'Bold' },
  { size: 14, label: 'Thick' },
];

export default function DrawingToolbar({
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange,
  eraseMode,
  onToggleErase,
  onUndo,
  onRedo,
  onClear,
  onAnalyze,
  disabled,
}) {
  return (
    <div className="toolbar-container">
      {/* Top Row: Color & Brush Controls */}
      <div className="toolbar-row">
        {/* Colors */}
        <div className="toolbar-group">
          <span className="toolbar-label">Color</span>
          <div className="swatches-cluster" role="radiogroup" aria-label="Drawing color options">
            {PALETTE.map((color) => (
              <button
                key={color.hex}
                type="button"
                aria-label={color.label}
                title={color.label}
                className={`color-swatch-btn ${strokeColor === color.hex && !eraseMode ? 'active' : ''}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => {
                  onStrokeColorChange(color.hex);
                  if (eraseMode) onToggleErase(false);
                }}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {/* Brush Size Presets */}
        <div className="toolbar-group">
          <span className="toolbar-label">Brush</span>
          <div className="stroke-pills">
            {BRUSH_PRESETS.map((preset) => (
              <button
                key={preset.size}
                type="button"
                className={`stroke-pill-btn ${strokeWidth === preset.size && !eraseMode ? 'active' : ''}`}
                onClick={() => {
                  onStrokeWidthChange(preset.size);
                  if (eraseMode) onToggleErase(false);
                }}
                disabled={disabled}
                title={`${preset.label} (${preset.size}px)`}
              >
                <span
                  className="stroke-dot-preview"
                  style={{
                    width: `${Math.min(preset.size, 10)}px`,
                    height: `${Math.min(preset.size, 10)}px`,
                  }}
                />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Actions & AI Analysis Trigger */}
      <div className="toolbar-row">
        <div className="toolbar-group">
          {/* Eraser Tool */}
          <button
            type="button"
            className={eraseMode ? 'active-tool' : ''}
            onClick={() => onToggleErase(!eraseMode)}
            disabled={disabled}
            title="Toggle Eraser"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="m5 11 9 9" />
            </svg>
            Eraser
          </button>

          {/* Undo */}
          <button type="button" onClick={onUndo} disabled={disabled} title="Undo stroke">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            Undo
          </button>

          {/* Redo */}
          <button type="button" onClick={onRedo} disabled={disabled} title="Redo stroke">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
            Redo
          </button>

          {/* Clear */}
          <button type="button" onClick={onClear} disabled={disabled} title="Clear canvas">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Clear
          </button>
        </div>

        {/* Primary AI Analyze CTA */}
        <button
          type="button"
          className="primary-btn"
          onClick={onAnalyze}
          disabled={disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Analyze Drawing
        </button>
      </div>
    </div>
  );
}
