import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

/**
 * Thin wrapper around react-sketch-canvas that exposes just what the app
 * needs: export the drawing as a PNG data URL, check if it's blank, and
 * the basic edit actions (undo/redo/clear/erase).
 */
const DrawingCanvas = forwardRef(function DrawingCanvas(
  { strokeColor = '#1f2a44', strokeWidth = 4, eraseMode = false },
  ref
) {
  const canvasRef = useRef(null);

  // react-sketch-canvas toggles erase mode via an imperative method, so
  // it's kept in sync whenever the toolbar's eraseMode state changes.
  useEffect(() => {
    canvasRef.current?.eraseMode(eraseMode);
  }, [eraseMode]);

  useImperativeHandle(ref, () => ({
    async exportImage() {
      // "png" gives us a solid, small, well-supported format for the API call.
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
    <div className="drawing-canvas-frame">
      <ReactSketchCanvas
        ref={canvasRef}
        width="100%"
        height="420px"
        canvasColor="#ffffff"
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        eraserWidth={20}
        style={{ border: '1px solid #ccc', borderRadius: '8px' }}
      />
    </div>
  );
});

export default DrawingCanvas;
