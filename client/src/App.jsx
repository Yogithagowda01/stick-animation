import React, { useRef, useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas.jsx';
import DrawingToolbar from './components/DrawingToolbar.jsx';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import SceneOptions from './components/SceneOptions.jsx';
import GenerationLoader from './components/GenerationLoader.jsx';
import ScenePreview from './components/ScenePreview.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import { analyzeDrawing, generateScene, animateScene } from './services/api.js';

// The user should always know what's happening — these labels back the
// four-stage pipeline shown while any AI call is in flight.
const STAGE_LABELS = {
  analyzing: 'Analyzing your drawing...',
  generating: 'Creating your scene...',
  animating: 'Bringing it to life...',
};

export default function App() {
  const canvasRef = useRef(null);

  // 'draw' | 'analyzing' | 'unrecognized' | 'analyze-error' | 'analyzed'
  // | 'style' | 'generating' | 'generate-error' | 'animating' | 'done'
  const [step, setStep] = useState('draw');

  const [strokeColor, setStrokeColor] = useState('#1f2a44');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraseMode, setEraseMode] = useState(false);
  const [inlineNotice, setInlineNotice] = useState('');

  const [analysis, setAnalysis] = useState(null);
  const [style, setStyle] = useState(null);
  const [sceneImage, setSceneImage] = useState(null);
  const [animation, setAnimation] = useState(null);
  const [lastErrorMessage, setLastErrorMessage] = useState('');

  async function handleAnalyzeClick() {
    setInlineNotice('');
    const blank = await canvasRef.current.isBlank();
    if (blank) {
      setInlineNotice('Please draw something before analyzing.');
      return;
    }

    const image = await canvasRef.current.exportImage();
    setStep('analyzing');

    const result = await analyzeDrawing(image);

    if (!result.ok) {
      setLastErrorMessage(result.message);
      setStep('analyze-error');
      return;
    }

    if (!result.recognized) {
      setLastErrorMessage(result.message);
      setStep('unrecognized');
      return;
    }

    setAnalysis(result.analysis);
    setStep('analyzed');
  }

  function handleContinueToStyle() {
    setStep('style');
  }

  async function handleGenerate(selectedStyle) {
    setStyle(selectedStyle);
    setStep('generating');

    const result = await generateScene(analysis, selectedStyle);
    if (!result.ok) {
      setLastErrorMessage(result.message);
      setStep('generate-error');
      return;
    }

    setSceneImage(result.image);
    setStep('animating');

    // Animation is deterministic and near-impossible to fail server-side,
    // but we still degrade gracefully to a default if the call itself
    // fails (e.g. a network hiccup) rather than blocking the final step.
    const animResult = await animateScene(analysis.action);
    if (animResult.ok) {
      setAnimation(animResult.animation);
    } else {
      setAnimation({ cssClass: 'anim-idle', label: 'Idle' });
    }
    setStep('done');
  }

  function handleStartOver() {
    canvasRef.current?.clear();
    setAnalysis(null);
    setStyle(null);
    setSceneImage(null);
    setAnimation(null);
    setLastErrorMessage('');
    setInlineNotice('');
    setStep('draw');
  }

  const isCanvasLocked = step !== 'draw';

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Stick Figure &rarr; Animated Scene</h1>
        <p className="app-subtitle">Draw &rarr; AI Understands &rarr; Generate &rarr; Animate</p>
      </header>

      <main className="app-main">
        <section className="draw-section">
          <DrawingCanvas
            ref={canvasRef}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            eraseMode={eraseMode}
          />
          <DrawingToolbar
            strokeColor={strokeColor}
            onStrokeColorChange={setStrokeColor}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            eraseMode={eraseMode}
            onToggleErase={setEraseMode}
            onUndo={() => canvasRef.current?.undo()}
            onRedo={() => canvasRef.current?.redo()}
            onClear={() => canvasRef.current?.clear()}
            onAnalyze={handleAnalyzeClick}
            disabled={isCanvasLocked}
          />
          {inlineNotice && <p className="inline-notice">{inlineNotice}</p>}
        </section>

        <section className="pipeline-section">
          {step === 'analyzing' && (
            <AnalysisPanel status="loading" stageLabel={STAGE_LABELS.analyzing} />
          )}

          {step === 'unrecognized' && (
            <AnalysisPanel
              status="unrecognized"
              errorMessage={lastErrorMessage}
              onRetry={handleStartOver}
            />
          )}

          {step === 'analyze-error' && (
            <AnalysisPanel status="error" errorMessage={lastErrorMessage} onRetry={handleAnalyzeClick} />
          )}

          {step === 'analyzed' && (
            <AnalysisPanel
              status="success"
              analysis={analysis}
              onContinue={handleContinueToStyle}
            />
          )}

          {step === 'style' && <SceneOptions onGenerate={handleGenerate} />}

          {step === 'generating' && <GenerationLoader stageLabel={STAGE_LABELS.generating} />}

          {step === 'generate-error' && (
            <div className="panel error-panel">
              <p>{lastErrorMessage}</p>
              <div className="result-actions">
                <button type="button" onClick={() => setStep('style')}>
                  Change Style
                </button>
                <button type="button" className="primary-btn" onClick={() => handleGenerate(style)}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {step === 'animating' && (
            <>
              <ScenePreview imageSrc={sceneImage} />
              <GenerationLoader stageLabel={STAGE_LABELS.animating} />
            </>
          )}

          {step === 'done' && (
            <ResultPanel imageSrc={sceneImage} animation={animation} onStartOver={handleStartOver} />
          )}
        </section>
      </main>
    </div>
  );
}
