import { useEffect, useState, useCallback } from 'react';
import { useMouseRecorder } from '@/hooks/useMouseRecorder';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMacroEditor } from '@/hooks/useMacroEditor';
import { RecordingCanvas } from '@/components/RecordingCanvas';
import { ControlPanel } from '@/components/ControlPanel';
import { TrajectoryViewer } from '@/components/TrajectoryViewer';
import { EditPanel } from '@/components/EditPanel';
import { TimeEditor } from '@/components/TimeEditor';
import { LiveCodePreview } from '@/components/LiveCodePreview';
import { FAQPanel } from '@/components/FAQPanel';
import { ReferenceImageControls } from '@/components/ReferenceImage';
import { ExecutionShortcutSelector } from '@/components/ExecutionShortcutSelector';
import { MousePointer2, Crosshair, ImagePlus, Lock, Unlock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ReferenceImageState {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  locked: boolean;
  originalWidth: number;
  originalHeight: number;
}

const Index = () => {
  const {
    state,
    points,
    recordingData,
    currentPosition,
    canvasRef,
    startRecording,
    stopRecording,
    reset,
    setRecordingData,
  } = useMouseRecorder();

  const {
    editSettings,
    timeSettings,
    segments,
    selectedSegment,
    derivedData,
    executionShortcut,
    initializeFromRecording,
    updateEditSetting,
    updateTimeMultiplier,
    setTargetDuration,
    resetToOriginal,
    addSegment,
    updateSegmentMultiplier,
    removeSegment,
    setSelectedSegment,
    setExecutionShortcut,
  } = useMacroEditor(recordingData);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [refImage, setRefImage] = useState<ReferenceImageState | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasSize = 700;

  const { shortcuts, isConfiguring, setIsConfiguring } = useKeyboardShortcuts(
    startRecording,
    stopRecording,
    state === 'recording'
  );

  // Timer for elapsed time during recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'recording') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 100);
      }, 100);
    } else if (state === 'idle') {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [state]);

  // Initialize editor when recording completes
  useEffect(() => {
    if (state === 'completed' && recordingData) {
      initializeFromRecording(recordingData);
    }
  }, [state, recordingData, initializeFromRecording]);

  // Reference image handlers
  const handleImageLoad = useCallback((src: string, width: number, height: number) => {
    const maxSize = canvasSize * 0.6;
    let w = width;
    let h = height;
    
    if (w > maxSize || h > maxSize) {
      const ratio = Math.min(maxSize / w, maxSize / h);
      w *= ratio;
      h *= ratio;
    }

    setRefImage({
      src,
      x: (canvasSize - w) / 2,
      y: (canvasSize - h) / 2,
      width: w,
      height: h,
      opacity: 0.5,
      locked: false,
      originalWidth: width,
      originalHeight: height,
    });
  }, []);

  const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
    if (!refImage || refImage.locked) return;
    e.stopPropagation();
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX - refImage.x, y: e.clientY - refImage.y });
  }, [refImage]);

  const handleImageResize = useCallback((e: React.MouseEvent) => {
    if (!refImage || refImage.locked) return;
    e.stopPropagation();
    setIsResizingImage(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [refImage]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!refImage) return;
    
    if (isDraggingImage) {
      setRefImage(prev => prev ? {
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      } : null);
    } else if (isResizingImage) {
      const deltaX = e.clientX - dragStart.x;
      const aspectRatio = refImage.originalWidth / refImage.originalHeight;
      
      setRefImage(prev => prev ? {
        ...prev,
        width: Math.max(50, prev.width + deltaX),
        height: Math.max(50, (prev.width + deltaX) / aspectRatio),
      } : null);
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [refImage, isDraggingImage, isResizingImage, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingImage(false);
    setIsResizingImage(false);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground gradient-mesh">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/15 rounded-2xl">
                <MousePointer2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mouse Motion Recorder</h1>
                <p className="text-sm text-muted-foreground">
                  Grave, visualize e exporte movimentos do mouse
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl">
                <Crosshair className="w-4 h-4 text-primary" />
                <span>Centro (0,0) = origem</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left: Canvas and visualization */}
          <div className="space-y-6">
            {/* Reference Image Controls */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <ReferenceImageControls
                  onImageLoad={handleImageLoad}
                  imageState={refImage ? { opacity: refImage.opacity, locked: refImage.locked } : null}
                  onUpdateOpacity={(opacity) => setRefImage(prev => prev ? { ...prev, opacity } : null)}
                  onToggleLock={() => setRefImage(prev => prev ? { ...prev, locked: !prev.locked } : null)}
                  onRemove={() => setRefImage(null)}
                />
              </div>
            </div>

            {/* Recording Canvas */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-center">
                <h2 className="text-lg font-medium text-muted-foreground">
                  {state === 'idle' && 'Área de Captura'}
                  {state === 'recording' && 'Movimente o mouse dentro da área'}
                  {state === 'completed' && 'Gravação Finalizada'}
                </h2>
              </div>
              
              <div 
                className="relative"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <RecordingCanvas
                  ref={canvasRef}
                  state={state}
                  points={points}
                  currentPosition={currentPosition}
                />
                
                {/* Reference Image Overlay */}
                {refImage && (
                  <div
                    className={cn(
                      "absolute transition-shadow pointer-events-auto",
                      !refImage.locked && "cursor-move",
                      isDraggingImage && "ring-2 ring-primary/50 rounded"
                    )}
                    style={{
                      left: refImage.x,
                      top: refImage.y,
                      width: refImage.width,
                      height: refImage.height,
                      opacity: refImage.opacity,
                      zIndex: 5,
                    }}
                    onMouseDown={handleImageMouseDown}
                  >
                    <img
                      src={refImage.src}
                      alt="Reference"
                      className="w-full h-full object-contain select-none pointer-events-none"
                      draggable={false}
                    />
                    
                    {/* Resize handle */}
                    {!refImage.locked && (
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 bg-primary/80 cursor-se-resize rounded-tl-lg flex items-center justify-center"
                        onMouseDown={handleImageResize}
                      >
                        <div className="w-2 h-2 border-r-2 border-b-2 border-white/80" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Trajectory Viewer */}
            {state === 'completed' && derivedData && derivedData.points.length > 1 && (
              <TrajectoryViewer 
                recordingData={{
                  points: derivedData.points,
                  startTime: recordingData?.startTime || 0,
                  endTime: recordingData?.endTime || 0,
                  duration: derivedData.duration,
                }} 
              />
            )}

            {/* Live Code Preview */}
            {state === 'completed' && derivedData && (
              <LiveCodePreview
                codeAHK={derivedData.codeAHK}
                codeLua={derivedData.codeLua}
                duration={derivedData.duration}
                pointCount={derivedData.pointCount}
              />
            )}
          </div>

          {/* Right: Controls */}
          <div className="space-y-6">
            <ControlPanel
              state={state}
              duration={state === 'recording' ? elapsedTime : (recordingData?.duration || 0)}
              pointCount={state === 'recording' ? points.length : (recordingData?.points.length || 0)}
              shortcuts={shortcuts}
              isConfiguring={isConfiguring}
              onStart={startRecording}
              onStop={stopRecording}
              onReset={reset}
              onConfigureShortcut={setIsConfiguring}
            />

            {/* Edit and Export panels */}
            {state === 'completed' && derivedData && (
              <>
                {/* Execution Shortcut Selector */}
                <ExecutionShortcutSelector
                  shortcut={executionShortcut}
                  onShortcutChange={setExecutionShortcut}
                />

                {/* Time Editor */}
                <TimeEditor
                  timeSettings={timeSettings}
                  segments={segments}
                  selectedSegment={selectedSegment}
                  onUpdateMultiplier={updateTimeMultiplier}
                  onSetTargetDuration={setTargetDuration}
                  onResetToOriginal={resetToOriginal}
                  onUpdateSegmentMultiplier={updateSegmentMultiplier}
                  onSelectSegment={setSelectedSegment}
                  onRemoveSegment={removeSegment}
                />

                {/* Space Editor */}
                <EditPanel
                  editSettings={editSettings}
                  onUpdateSetting={updateEditSetting}
                  onReset={resetToOriginal}
                />
              </>
            )}

            {/* Instructions */}
            {state === 'idle' && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Como usar</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                    <span>Clique em <strong className="text-foreground">Iniciar Gravação</strong> ou pressione <kbd className="px-1.5 py-0.5 glass rounded text-xs">{shortcuts.startRecording}</kbd></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                    <span>Mova o mouse na área de captura. O centro representa (0,0)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                    <span>Clique em <strong className="text-foreground">Finalizar</strong> ou pressione <kbd className="px-1.5 py-0.5 glass rounded text-xs">{shortcuts.stopRecording}</kbd></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</span>
                    <span>Visualize, edite e exporte seu movimento como script</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto px-6 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Ferramenta de automação e aprendizado • Criado por <span className="text-primary font-medium">Você</span>
          </p>
        </div>
      </footer>

      {/* FAQ Panel */}
      <FAQPanel />
    </div>
  );
};

export default Index;
