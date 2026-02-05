 import { forwardRef } from 'react';
 import { MousePoint, RecordingState } from '@/types/recording';
 import { cn } from '@/lib/utils';
 
 interface RecordingCanvasProps {
   state: RecordingState;
   points: MousePoint[];
   currentPosition: { x: number; y: number };
 }
 
 export const RecordingCanvas = forwardRef<HTMLDivElement, RecordingCanvasProps>(
   ({ state, points, currentPosition }, ref) => {
     const canvasSize = 500;
     const center = canvasSize / 2;
     const gridStep = 50;
 
     const renderGrid = () => {
       const lines = [];
       const gridColor = 'hsl(var(--grid))';
       const gridAccent = 'hsl(var(--grid-accent))';
 
       // Vertical lines
       for (let x = 0; x <= canvasSize; x += gridStep) {
         const isCenter = x === center;
         lines.push(
           <line
             key={`v-${x}`}
             x1={x}
             y1={0}
             x2={x}
             y2={canvasSize}
             stroke={isCenter ? gridAccent : gridColor}
             strokeWidth={isCenter ? 2 : 1}
           />
         );
       }
 
       // Horizontal lines
       for (let y = 0; y <= canvasSize; y += gridStep) {
         const isCenter = y === center;
         lines.push(
           <line
             key={`h-${y}`}
             x1={0}
             y1={y}
             x2={canvasSize}
             y2={y}
             stroke={isCenter ? gridAccent : gridColor}
             strokeWidth={isCenter ? 2 : 1}
           />
         );
       }
 
       return lines;
     };
 
     const renderTrajectory = () => {
       if (points.length < 2) return null;
 
       const pathData = points
         .map((p, i) => {
           const x = center + p.x;
           const y = center - p.y; // Invert Y back for SVG
           return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
         })
         .join(' ');
 
       return (
         <>
           {/* Glow effect */}
           <path
             d={pathData}
             fill="none"
             stroke="hsl(var(--trajectory-glow))"
             strokeWidth={6}
             strokeLinecap="round"
             strokeLinejoin="round"
             opacity={0.3}
           />
           {/* Main path */}
           <path
             d={pathData}
             fill="none"
             stroke="hsl(var(--trajectory))"
             strokeWidth={2}
             strokeLinecap="round"
             strokeLinejoin="round"
           />
         </>
       );
     };
 
     const renderCurrentPoint = () => {
       if (state !== 'recording') return null;
 
       const x = center + currentPosition.x;
       const y = center - currentPosition.y;
 
       return (
         <>
           <circle
             cx={x}
             cy={y}
             r={8}
             fill="hsl(var(--trajectory-glow))"
             opacity={0.4}
           />
           <circle
             cx={x}
             cy={y}
             r={4}
             fill="hsl(var(--trajectory))"
           />
         </>
       );
     };
 
     return (
       <div
         ref={ref}
         className={cn(
           'relative rounded-xl overflow-hidden transition-all duration-300',
           'bg-canvas border-2',
           state === 'recording' ? 'border-recording glow-recording' : 'border-border'
         )}
       >
         <svg
           width={canvasSize}
           height={canvasSize}
           className="block"
           viewBox={`0 0 ${canvasSize} ${canvasSize}`}
         >
           {/* Grid */}
           {renderGrid()}
 
           {/* Center point marker */}
           <circle
             cx={center}
             cy={center}
             r={6}
             fill="hsl(var(--center-point))"
           />
           <circle
             cx={center}
             cy={center}
             r={10}
             fill="none"
             stroke="hsl(var(--center-point))"
             strokeWidth={2}
             opacity={0.5}
           />
 
           {/* Axis labels */}
           <text
             x={center + 15}
             y={center - 10}
             fill="hsl(var(--muted-foreground))"
             fontSize={12}
             fontFamily="monospace"
           >
             (0,0)
           </text>
 
           {/* Trajectory */}
           {renderTrajectory()}
 
           {/* Current position */}
           {renderCurrentPoint()}
         </svg>
 
         {/* Recording indicator */}
         {state === 'recording' && (
           <div className="absolute top-4 left-4 flex items-center gap-2 bg-recording/20 px-3 py-1.5 rounded-full">
             <div className="w-2 h-2 rounded-full bg-recording recording-pulse" />
             <span className="text-sm font-medium text-recording">Gravando...</span>
           </div>
         )}
 
         {/* Position display */}
         {state === 'recording' && (
           <div className="absolute bottom-4 right-4 font-mono text-sm text-muted-foreground bg-card/80 px-3 py-1.5 rounded-lg backdrop-blur">
             X: {currentPosition.x.toFixed(0)} | Y: {currentPosition.y.toFixed(0)}
           </div>
         )}
       </div>
     );
   }
 );
 
 RecordingCanvas.displayName = 'RecordingCanvas';