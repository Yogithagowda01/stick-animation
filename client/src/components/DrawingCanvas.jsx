import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

/**
 * Creative studio canvas wrapper around react-sketch-canvas.
 * Exposes methods to export PNG data URL, check emptiness, and handle undo/redo/clear.
 */
const DrawingCanvas = forwardRef(function DrawingCanvas(
  { strokeColor = '#0f172a', strokeWidth = 4, eraseMode = false },
  ref
) {
  const canvasRef = useRef(null);

  useEffect(() => {
    canvasRef.current?.eraseMode(eraseMode);
  }, [eraseMode]);

  useImperativeHandle(ref, () => ({
    async exportImage() {
      return canvasRef.current.exportImage('png');
    },
    async isBlank() {
      const paths = await canvasRef.current.exportPaths();
      return !paths || paths.length === 0;
    },
    clear() {
      canvasRef.current.clearCanvas();
    },
    undo() {
      canvasRef.current.undo();
    },
    redo() {
      canvasRef.current.redo();
    },
  }));

  return (
    <div className="canvas-wrapper">
      <div className="canvas-grid-overlay" aria-hidden="true" />
      <div className="drawing-canvas-frame">
        <ReactSketchCanvas
          ref={canvasRef}
          width="100%"
          height="400px"
          canvasColor="#ffffff"
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          eraserWidth={24}
          style={{ border: 'none', background: 'transparent' }}
        />
      </div>
      <div className="canvas-watermark">AnimSketch Studio Pad</div>
    </div>
  );
});

export default DrawingCanvas;
