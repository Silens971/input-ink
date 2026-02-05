 import { useState, useRef, useEffect, useCallback } from 'react';
 import { RecordingData } from '@/types/recording';
 import { Button } from '@/components/ui/button';
 import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';
 
 interface TrajectoryViewerProps {
   recordingData: RecordingData;
 }
 
 export function TrajectoryViewer({ recordingData }: TrajectoryViewerProps) {
   const [zoom, setZoom] = useState(1);
   const [pan, setPan] = useState({ x: 0, y: 0 });
   const [isPanning, setIsPanning] = useState(false);
   const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
   const containerRef = useRef<HTMLDivElement>(null);
 
   const canvasSize = 400;
   const center = canvasSize / 2;
 
   // Calculate bounds for auto-zoom
   const bounds = recordingData.points.reduce(
     (acc, p) => ({
       minX: Math.min(acc.minX, p.x),
       maxX: Math.max(acc.maxX, p.x),
       minY: Math.min(acc.minY, p.y),
       maxY: Math.max(acc.maxY, p.y),
     }),
     { minX: 0, maxX: 0, minY: 0, maxY: 0 }
   );
 
   const maxExtent = Math.max(
     Math.abs(bounds.minX),
     Math.abs(bounds.maxX),
     Math.abs(bounds.minY),
     Math.abs(bounds.maxY),
     50
   );
 
   const scale = (canvasSize / 2 - 40) / maxExtent;
 
   const handleMouseDown = (e: React.MouseEvent) => {
     setIsPanning(true);
     setLastMousePos({ x: e.clientX, y: e.clientY });
   };
 
   const handleMouseMove = useCallback((e: MouseEvent) => {
     if (!isPanning) return;
     
     const dx = e.clientX - lastMousePos.x;
     const dy = e.clientY - lastMousePos.y;
     
     setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
     setLastMousePos({ x: e.clientX, y: e.clientY });
   }, [isPanning, lastMousePos]);
 
   const handleMouseUp = useCallback(() => {
     setIsPanning(false);
   }, []);
 
   useEffect(() => {
     if (isPanning) {
       window.addEventListener('mousemove', handleMouseMove);
       window.addEventListener('mouseup', handleMouseUp);
       return () => {
         window.removeEventListener('mousemove', handleMouseMove);
         window.removeEventListener('mouseup', handleMouseUp);
       };
     }
   }, [isPanning, handleMouseMove, handleMouseUp]);
 
   const handleWheel = (e: React.WheelEvent) => {
     e.preventDefault();
     const delta = e.deltaY > 0 ? 0.9 : 1.1;
     setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 5));
   };
 
   const resetView = () => {
     setZoom(1);
     setPan({ x: 0, y: 0 });
   };
 
   const renderGrid = () => {
     const lines = [];
     const gridStep = 50 / zoom;
     const gridColor = 'hsl(var(--grid))';
     const gridAccent = 'hsl(var(--grid-accent))';
 
     for (let x = -canvasSize; x <= canvasSize * 2; x += gridStep) {
       const isCenter = Math.abs(x - center) < 1;
       lines.push(
         <line
           key={`v-${x}`}
           x1={x}
           y1={-canvasSize}
           x2={x}
           y2={canvasSize * 2}
           stroke={isCenter ? gridAccent : gridColor}
           strokeWidth={isCenter ? 2 / zoom : 1 / zoom}
         />
       );
     }
 
     for (let y = -canvasSize; y <= canvasSize * 2; y += gridStep) {
       const isCenter = Math.abs(y - center) < 1;
       lines.push(
         <line
           key={`h-${y}`}
           x1={-canvasSize}
           y1={y}
           x2={canvasSize * 2}
           y2={y}
           stroke={isCenter ? gridAccent : gridColor}
           strokeWidth={isCenter ? 2 / zoom : 1 / zoom}
         />
       );
     }
 
     return lines;
   };
 
   const renderTrajectory = () => {
     if (recordingData.points.length < 2) return null;
 
     const pathData = recordingData.points
       .map((p, i) => {
         const x = center + p.x * scale;
         const y = center - p.y * scale;
         return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
       })
       .join(' ');
 
     return (
       <>
         <path
           d={pathData}
           fill="none"
           stroke="hsl(var(--trajectory-glow))"
           strokeWidth={8 / zoom}
           strokeLinecap="round"
           strokeLinejoin="round"
           opacity={0.3}
         />
         <path
           d={pathData}
           fill="none"
           stroke="hsl(var(--trajectory))"
           strokeWidth={3 / zoom}
           strokeLinecap="round"
           strokeLinejoin="round"
         />
         {/* Start point */}
         <circle
           cx={center + recordingData.points[0].x * scale}
           cy={center - recordingData.points[0].y * scale}
           r={6 / zoom}
           fill="hsl(var(--success))"
         />
         {/* End point */}
         <circle
           cx={center + recordingData.points[recordingData.points.length - 1].x * scale}
           cy={center - recordingData.points[recordingData.points.length - 1].y * scale}
           r={6 / zoom}
           fill="hsl(var(--destructive))"
         />
       </>
     );
   };
 
   return (
     <div className="bg-card rounded-xl p-6 space-y-4 border border-border fade-in">
       <div className="flex items-center justify-between">
         <h3 className="font-semibold text-lg">Visualização da Trajetória</h3>
         <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="icon"
             onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
           >
             <ZoomIn className="w-4 h-4" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}
           >
             <ZoomOut className="w-4 h-4" />
           </Button>
           <Button variant="ghost" size="icon" onClick={resetView}>
             <RotateCcw className="w-4 h-4" />
           </Button>
         </div>
       </div>
 
       <div
         ref={containerRef}
         className="relative overflow-hidden rounded-lg bg-canvas cursor-grab active:cursor-grabbing"
         style={{ height: canvasSize }}
         onMouseDown={handleMouseDown}
         onWheel={handleWheel}
       >
         <svg
           width="100%"
           height="100%"
           viewBox={`0 0 ${canvasSize} ${canvasSize}`}
           style={{
             transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
             transformOrigin: 'center',
           }}
         >
           {renderGrid()}
           
           {/* Center point */}
           <circle
             cx={center}
             cy={center}
             r={8 / zoom}
             fill="hsl(var(--center-point))"
           />
           <circle
             cx={center}
             cy={center}
             r={12 / zoom}
             fill="none"
             stroke="hsl(var(--center-point))"
             strokeWidth={2 / zoom}
             opacity={0.5}
           />
 
           {renderTrajectory()}
         </svg>
 
         {/* Legend */}
         <div className="absolute bottom-3 left-3 flex gap-4 text-xs bg-card/80 backdrop-blur px-3 py-2 rounded-lg">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-success" />
             <span className="text-muted-foreground">Início</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-destructive" />
             <span className="text-muted-foreground">Fim</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-center" />
             <span className="text-muted-foreground">Centro (0,0)</span>
           </div>
         </div>
 
         {/* Controls hint */}
         <div className="absolute top-3 right-3 flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur px-3 py-2 rounded-lg">
           <Move className="w-3 h-3" />
           <span>Arraste para mover • Scroll para zoom</span>
         </div>
       </div>
 
       {/* Stats */}
       <div className="grid grid-cols-4 gap-4">
         <div className="text-center p-3 bg-secondary/50 rounded-lg">
           <div className="text-2xl font-bold text-primary">{recordingData.points.length}</div>
           <div className="text-xs text-muted-foreground">Pontos</div>
         </div>
         <div className="text-center p-3 bg-secondary/50 rounded-lg">
           <div className="text-2xl font-bold text-primary">{(recordingData.duration / 1000).toFixed(1)}s</div>
           <div className="text-xs text-muted-foreground">Duração</div>
         </div>
         <div className="text-center p-3 bg-secondary/50 rounded-lg">
           <div className="text-2xl font-bold text-primary">{(maxExtent * 2).toFixed(0)}px</div>
           <div className="text-xs text-muted-foreground">Extensão</div>
         </div>
         <div className="text-center p-3 bg-secondary/50 rounded-lg">
           <div className="text-2xl font-bold text-primary">{zoom.toFixed(1)}x</div>
           <div className="text-xs text-muted-foreground">Zoom</div>
         </div>
       </div>
     </div>
   );
 }