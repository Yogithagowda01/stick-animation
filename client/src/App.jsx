import React, { useRef, useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas.jsx';
import DrawingToolbar from './components/DrawingToolbar.jsx';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import SceneOptions from './components/SceneOptions.jsx';
import GenerationLoader from './components/GenerationLoader.jsx';
import ScenePreview from './components/ScenePreview.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import { analyzeDrawing, generateScene, animateScene } from './services/api.js';

const STAGE_LABELS = {
  analyzing: 'Analyzing your drawing...',
  generating: 'Creating your scene with Gemini AI...',
  animating: 'Applying motion and bringing scene to life...',
};

const STEPS_META = [
  { id: 1, label: 'Draw', key: 'draw' },
  { id: 2, label: 'AI Understands', key: 'vision' },
  { id: 3, label: 'Generate Scene', key: 'generate' },
  { id: 4, label: 'Animate', key: 'animate' },
];

const INSPIRATION_IDEAS = [
  '🏃 Running figure',
  '🕺 Dancing stickman',
  '⚽ Kicking a ball',
  '🤸 Jumping stick figure',
  '👋 Waving hello',
  '🧘 Meditating stick figure',
];

export default function App() {
  const canvasRef = useRef(null);

  // 'draw' | 'analyzing' | 'unrecognized' | 'analyze-error' | 'analyzed'
  // | 'style' | 'generating' | 'generate-error' | 'animating' | 'done'
  const [step, setStep] = useState('draw');

  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraseMode, setEraseMode] = useState(false);
  const [inlineNotice, setInlineNotice] = useState('');

  // Stored assets for the pipeline & comparison
  const [sketchImage, setSketchImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [style, setStyle] = useState('cartoon');
  const [sceneImage, setSceneImage] = useState(null);
  const [animation, setAnimation] = useState(null);
  const [lastErrorMessage, setLastErrorMessage] = useState('');

  // Helper to determine which of the 4 visual pipeline stages is active
  function getActivePipelineStage() {
    if (step === 'draw') return 1;
    if (['analyzing', 'unrecognized', 'analyze-error', 'analyzed'].includes(step)) return 2;
    if (['style', 'generating', 'generate-error'].includes(step)) return 3;
    if (['animating', 'done'].includes(step)) return 4;
    return 1;
  }

  const currentStageNum = getActivePipelineStage();

  async function handleAnalyzeClick() {
    setInlineNotice('');
    const blank = await canvasRef.current.isBlank();
    if (blank) {
      setInlineNotice('Please sketch a stick figure before analyzing.');
      return;
    }

    const image = await canvasRef.current.exportImage();
    setSketchImage(image);
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
    const targetStyle = selectedStyle || style;
    setStyle(targetStyle);
    setStep('generating');

    const result = await generateScene(analysis, targetStyle);
    if (!result.ok) {
      setLastErrorMessage(result.message);
      setStep('generate-error');
      return;
    }

    setSceneImage(result.image);
    setStep('animating');

    // Fetch deterministic animation preset based on detected action
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
    setSketchImage(null);
    setAnalysis(null);
    setStyle('cartoon');
    setSceneImage(null);
    setAnimation(null);
    setLastErrorMessage('');
    setInlineNotice('');
    setStep('draw');
  }

  const isCanvasLocked = step !== 'draw';

  return (
    <div className="app-shell">
      {/* Top Bar Navigation */}
      <nav className="app-topbar">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="3" />
              <path d="M12 8v8M12 11l-5 4M12 11l5 4M12 16l-4 5M12 16l4 5" />
            </svg>
          </div>
          <div>
            <h1 className="brand-title">AnimSketch AI</h1>
          </div>
          <span className="brand-badge">Studio MVP</span>
        </div>

        <div className="header-meta">
          <div className="model-pill">
            <span className="status-dot" />
            <span>Gemini Vision + Image</span>
          </div>
        </div>
      </nav>

      {/* Hero Intro */}
      <header className="hero-section">
        <h2 className="hero-heading">
          Stick Figure <span className="gradient-text">&rarr; Animated Scene</span>
        </h2>
        <p className="hero-subtitle">
          Sketch a stick figure on the studio pad. AI understands your pose, generates a rich stylized scene, and brings it to life with motion.
        </p>
      </header>

      {/* 4-Step Pipeline Flow Indicator */}
      <div className="pipeline-stepper" role="navigation" aria-label="Creation pipeline steps">
        {STEPS_META.map((s, index) => {
          const isCurrent = currentStageNum === s.id;
          const isDone = currentStageNum > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className={`step-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}`}>
                <span className="step-num">{isDone ? '✓' : s.id}</span>
                <span>{s.label}</span>
              </div>
              {index < STEPS_META.length - 1 && <span className="step-divider">&rarr;</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Workspace Layout */}
      <main className="workspace-grid">
        {/* Draw Section: Visible during drawing & analysis */}
        {['draw', 'analyzing', 'unrecognized', 'analyze-error', 'analyzed'].includes(step) && (
          <section className="studio-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <span style={{ fontSize: '1.2rem' }}>✏️</span>
                <h3>Step 1: Draw Your Stick Figure</h3>
              </div>
              <span className={`card-badge ${step === 'draw' ? 'live' : ''}`}>
                {step === 'draw' ? 'Canvas Active' : 'Canvas Locked'}
              </span>
            </div>

            {/* Quick Inspiration Ideas */}
            {step === 'draw' && (
              <div className="quick-tips-bar">
                <span className="quick-tip-label">💡 Ideas:</span>
                {INSPIRATION_IDEAS.map((idea, idx) => (
                  <span key={idx} className="quick-chip">
                    {idea}
                  </span>
                ))}
              </div>
            )}

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

            {inlineNotice && (
              <div className="inline-notice">
                <span>⚠️</span>
                <span>{inlineNotice}</span>
              </div>
            )}
          </section>
        )}

        {/* Pipeline Feedback & Result Stages */}
        <section className="pipeline-section">
          {/* 1. Analyzing Loading */}
          {step === 'analyzing' && (
            <AnalysisPanel status="loading" stageLabel={STAGE_LABELS.analyzing} />
          )}

          {/* 2. Unrecognized Sketch Retry */}
          {step === 'unrecognized' && (
            <AnalysisPanel
              status="unrecognized"
              errorMessage={lastErrorMessage}
              onRetry={handleStartOver}
            />
          )}

          {/* 3. Analysis Error */}
          {step === 'analyze-error' && (
            <AnalysisPanel
              status="error"
              errorMessage={lastErrorMessage}
              onRetry={handleAnalyzeClick}
            />
          )}

          {/* 4. Analysis Succeeded */}
          {step === 'analyzed' && (
            <AnalysisPanel
              status="success"
              analysis={analysis}
              sketchImage={sketchImage}
              onContinue={handleContinueToStyle}
            />
          )}

          {/* 5. Style Picker */}
          {step === 'style' && (
            <SceneOptions
              analysis={analysis}
              onGenerate={handleGenerate}
              onBack={() => setStep('analyzed')}
            />
          )}

          {/* 6. Generating Image Loading */}
          {step === 'generating' && (
            <GenerationLoader stageLabel={STAGE_LABELS.generating} />
          )}

          {/* 7. Image Generation Error */}
          {step === 'generate-error' && (
            <div className="studio-card error-card">
              <div className="error-icon">⚠️</div>
              <div>
                <h3 className="error-title">Generation Issue</h3>
                <p className="error-text">
                  {lastErrorMessage || 'The AI service could not create an image for this scene.'}
                </p>
              </div>
              <div className="result-actions-cluster">
                <button type="button" onClick={() => setStep('style')}>
                  Change Style
                </button>
                <button type="button" className="primary-btn" onClick={() => handleGenerate(style)}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* 8. Animating Transition */}
          {step === 'animating' && (
            <>
              <ScenePreview imageSrc={sceneImage} />
              <GenerationLoader stageLabel={STAGE_LABELS.animating} />
            </>
          )}

          {/* 9. Final Animated Scene Result */}
          {step === 'done' && (
            <ResultPanel
              imageSrc={sceneImage}
              sketchSrc={sketchImage}
              animation={animation}
              onStartOver={handleStartOver}
              onChangeStyle={() => setStep('style')}
              onRegenerate={() => handleGenerate(style)}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>AnimSketch AI Studio &bull; Powered by Gemini 3 Flash &amp; Flash-Image &bull; Pure React &amp; CSS</p>
      </footer>
    </div>
  );
}
