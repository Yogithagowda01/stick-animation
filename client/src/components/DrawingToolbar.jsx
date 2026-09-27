import React from 'react';

const COLORS = ['#1f2a44', '#d85a30', '#0f6e56', '#534ab7'];

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
    <div className="toolbar">
      <div className="toolbar-group">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use color ${c}`}
            className={`color-swatch ${strokeColor === c && !eraseMode ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => {
              onStrokeColorChange(c);
              if (eraseMode) onToggleErase(false);
            }}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="toolbar-group">
        <label htmlFor="brush-size" className="toolbar-label">
          Brush
        </label>
        <input
          id="brush-size"
          type="range"
          min="2"
          max="12"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          disabled={disabled}
        />
      </div>

      <div className="toolbar-group">
        <button type="button" onClick={onUndo} disabled={disabled}>
          Undo
        </button>
        <button type="button" onClick={onRedo} disabled={disabled}>
          Redo
        </button>
        <button
          type="button"
          className={eraseMode ? 'active' : ''}
          onClick={() => onToggleErase(!eraseMode)}
          disabled={disabled}
        >
          Eraser
        </button>
        <button type="button" onClick={onClear} disabled={disabled}>
          Clear
        </button>
      </div>

      <button type="button" className="primary-btn" onClick={onAnalyze} disabled={disabled}>
        Analyze Drawing
      </button>
    </div>
  );
}
