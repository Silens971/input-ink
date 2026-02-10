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
import { ImportTrajectory } from '@/components/ImportTrajectory';
import { MousePointer2 } from 'lucide-react';
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
    importRecording,
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

  const canvasSize = 1000;

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
    <div className="h-screen bg-background text-foreground gradient-mesh flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-border/50 glass z-10 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/15 rounded-xl">
                <MousePointer2 className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-base font-bold">Mouse Motion Recorder</h1>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium">
                {state === 'idle' && 'Pronto'}
                {state === 'recording' && 'Gravando...'}
                {state === 'completed' && 'Concluído'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main: Canvas takes most of the space */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Canvas area - constrained to viewport */}
        <div className="flex-1 relative min-h-0 min-w-0 flex items-center justify-center p-3">
          {/* Reference Image Controls - floating */}
          <div className="absolute top-3 left-3 z-10 glass rounded-xl p-2">
            <ReferenceImageControls
              onImageLoad={handleImageLoad}
              imageState={refImage ? { opacity: refImage.opacity, locked: refImage.locked } : null}
              onUpdateOpacity={(opacity) => setRefImage(prev => prev ? { ...prev, opacity } : null)}
              onToggleLock={() => setRefImage(prev => prev ? { ...prev, locked: !prev.locked } : null)}
              onRemove={() => setRefImage(null)}
            />
          </div>

          <div 
            className="relative h-full aspect-square max-h-full max-w-full"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <RecordingCanvas
              ref={canvasRef}
              state={state}
              points={points}
              currentPosition={currentPosition}
              className="h-full w-full"
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

        {/* Right sidebar: Controls */}
        <div className="lg:w-[380px] lg:border-l border-border/50 lg:overflow-y-auto p-4 space-y-4">
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

          {/* Import Trajectory */}
          <ImportTrajectory onImport={importRecording} />

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

          {/* Edit and Export panels */}
          {state === 'completed' && derivedData && (
            <>
              <ExecutionShortcutSelector
                shortcut={executionShortcut}
                onShortcutChange={setExecutionShortcut}
              />

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

              <EditPanel
                editSettings={editSettings}
                onUpdateSetting={updateEditSetting}
                onReset={resetToOriginal}
              />

              <LiveCodePreview
                codeAHK={derivedData.codeAHK}
                codeLua={derivedData.codeLua}
                duration={derivedData.duration}
                pointCount={derivedData.pointCount}
              />
            </>
          )}

          {/* Instructions */}
          {state === 'idle' && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold mb-3 text-sm">Como usar</h3>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Clique em <strong className="text-foreground">Iniciar Gravação</strong> ou <kbd className="px-1 py-0.5 glass rounded text-[10px]">{shortcuts.startRecording}</kbd></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Mova o mouse na área de captura</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Finalize com <kbd className="px-1 py-0.5 glass rounded text-[10px]">{shortcuts.stopRecording}</kbd></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>Edite e exporte como script</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </main>

      {/* FAQ Panel */}
      <FAQPanel />
    </div>
  );
};

export default Index;
