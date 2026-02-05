import { useEffect } from 'react';
 import { useMouseRecorder } from '@/hooks/useMouseRecorder';
 import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMacroEditor } from '@/hooks/useMacroEditor';
 import { RecordingCanvas } from '@/components/RecordingCanvas';
 import { ControlPanel } from '@/components/ControlPanel';
 import { TrajectoryViewer } from '@/components/TrajectoryViewer';
 import { EditPanel } from '@/components/EditPanel';
import { TimeEditor } from '@/components/TimeEditor';
import { LiveCodePreview } from '@/components/LiveCodePreview';
import { useState } from 'react';
 import { MousePointer2, Crosshair } from 'lucide-react';
 
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
    initializeFromRecording,
    updateEditSetting,
    updateTimeMultiplier,
    setTargetDuration,
    resetToOriginal,
    addSegment,
    updateSegmentMultiplier,
    removeSegment,
    setSelectedSegment,
  } = useMacroEditor(recordingData);

   const [elapsedTime, setElapsedTime] = useState(0);
 
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
 
   return (
     <div className="min-h-screen bg-background text-foreground">
       {/* Header */}
       <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
         <div className="container mx-auto px-6 py-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-lg">
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
               <div className="flex items-center gap-2">
                 <Crosshair className="w-4 h-4" />
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
             {/* Recording Canvas */}
             <div className="flex flex-col items-center">
               <div className="mb-4 text-center">
                 <h2 className="text-lg font-medium text-muted-foreground">
                   {state === 'idle' && 'Área de Captura'}
                   {state === 'recording' && 'Movimente o mouse dentro da área'}
                   {state === 'completed' && 'Gravação Finalizada'}
                 </h2>
               </div>
               <RecordingCanvas
                 ref={canvasRef}
                 state={state}
                 points={points}
                 currentPosition={currentPosition}
               />
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

              {/* Live Code Preview - always visible when completed */}
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
               <div className="bg-card rounded-xl p-6 border border-border">
                 <h3 className="font-semibold mb-4">Como usar</h3>
                 <ol className="space-y-3 text-sm text-muted-foreground">
                   <li className="flex gap-3">
                     <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                     <span>Clique em <strong className="text-foreground">Iniciar Gravação</strong> ou pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">{shortcuts.startRecording}</kbd></span>
                   </li>
                   <li className="flex gap-3">
                     <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                     <span>Mova o mouse na área de captura. O centro representa (0,0)</span>
                   </li>
                   <li className="flex gap-3">
                     <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                     <span>Clique em <strong className="text-foreground">Finalizar</strong> ou pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">{shortcuts.stopRecording}</kbd></span>
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
       <footer className="border-t border-border mt-auto">
         <div className="container mx-auto px-6 py-4">
           <p className="text-sm text-muted-foreground text-center">
             Ferramenta de automação e aprendizado • Movimentos relativos ao ponto central
           </p>
         </div>
       </footer>
     </div>
   );
 };
 
 export default Index;
