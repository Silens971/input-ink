 import { forwardRef } from 'react';
 import { MousePoint, RecordingState } from '@/types/recording';
 import { cn } from '@/lib/utils';
 
interface RecordingCanvasProps {
    state: RecordingState;
    points: MousePoint[];
    currentPosition: { x: number; y: number };
    className?: string;
  }
 
export const RecordingCanvas = forwardRef<HTMLDivElement, RecordingCanvasProps>(
    ({ state, points, currentPosition, className }, ref) => {
      const canvasSize = 1000;
      const center = canvasSize / 2;
      const gridStep = 50;
      const majorGridStep = 100;

      const renderGrid = () => {
        const elements = [];
        const gridColor = 'hsl(var(--grid))';
        const gridAccent = 'hsl(var(--grid-accent))';
        const axisColor = 'hsl(var(--muted-foreground))';

        // Minor grid lines
        for (let x = 0; x <= canvasSize; x += gridStep) {
          const isCenter = x === center;
          const isMajor = (x - center) % majorGridStep === 0;
          if (isCenter) continue;
          elements.push(
            <line
              key={`v-${x}`}
              x1={x} y1={0} x2={x} y2={canvasSize}
              stroke={isMajor ? gridAccent : gridColor}
              strokeWidth={isMajor ? 1 : 0.5}
              opacity={isMajor ? 0.6 : 0.3}
            />
          );
        }

        for (let y = 0; y <= canvasSize; y += gridStep) {
          const isCenter = y === center;
          const isMajor = (y - center) % majorGridStep === 0;
          if (isCenter) continue;
          elements.push(
            <line
              key={`h-${y}`}
              x1={0} y1={y} x2={canvasSize} y2={y}
              stroke={isMajor ? gridAccent : gridColor}
              strokeWidth={isMajor ? 1 : 0.5}
              opacity={isMajor ? 0.6 : 0.3}
            />
          );
        }

        // Axes (X and Y through center)
        elements.push(
          <line key="axis-x" x1={0} y1={center} x2={canvasSize} y2={center}
            stroke={axisColor} strokeWidth={1.5} opacity={0.5} />,
          <line key="axis-y" x1={center} y1={0} x2={center} y2={canvasSize}
            stroke={axisColor} strokeWidth={1.5} opacity={0.5} />
        );

        // Axis tick marks and labels
        for (let x = 0; x <= canvasSize; x += majorGridStep) {
          if (x === center) continue;
          const value = x - center;
          elements.push(
            <line key={`tick-x-${x}`} x1={x} y1={center - 5} x2={x} y2={center + 5}
              stroke={axisColor} strokeWidth={1} opacity={0.6} />,
            <text key={`label-x-${x}`} x={x} y={center + 18}
              fill={axisColor} fontSize={10} fontFamily="monospace"
              textAnchor="middle" opacity={0.5}>
              {value}
            </text>
          );
        }

        for (let y = 0; y <= canvasSize; y += majorGridStep) {
          if (y === center) continue;
          const value = -(y - center); // Invert for standard coords
          elements.push(
            <line key={`tick-y-${y}`} x1={center - 5} y1={y} x2={center + 5} y2={y}
              stroke={axisColor} strokeWidth={1} opacity={0.6} />,
            <text key={`label-y-${y}`} x={center - 12} y={y + 4}
              fill={axisColor} fontSize={10} fontFamily="monospace"
              textAnchor="end" opacity={0.5}>
              {value}
            </text>
          );
        }

        // Axis labels
        elements.push(
          <text key="axis-label-x" x={canvasSize - 8} y={center - 10}
            fill={axisColor} fontSize={12} fontFamily="monospace"
            textAnchor="end" opacity={0.4} fontWeight="bold">X</text>,
          <text key="axis-label-y" x={center + 12} y={14}
            fill={axisColor} fontSize={12} fontFamily="monospace"
            textAnchor="start" opacity={0.4} fontWeight="bold">Y</text>
        );

        return elements;
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
             'relative rounded-2xl overflow-hidden transition-all duration-300 w-full aspect-square',
             'bg-canvas border-2',
             state === 'recording' ? 'border-recording glow-recording' : 'border-border/50',
             className
           )}
         >
          <svg
            width="100%"
            height="100%"
            className="block"
            viewBox={`0 0 ${canvasSize} ${canvasSize}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid */}
            {renderGrid()}

            {/* Center point marker */}
            <circle cx={center} cy={center} r={4}
              fill="hsl(var(--center-point))" />
            <circle cx={center} cy={center} r={8}
              fill="none" stroke="hsl(var(--center-point))"
              strokeWidth={1.5} opacity={0.4} />

            {/* Trajectory */}
            {renderTrajectory()}

            {/* Current position */}
            {renderCurrentPoint()}
          </svg>
 
          {/* Recording indicator */}
          {state === 'recording' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 glass px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-recording recording-pulse" />
              <span className="text-sm font-medium text-recording">Gravando...</span>
            </div>
          )}
 
          {/* Position display */}
          {state === 'recording' && (
            <div className="absolute bottom-4 right-4 font-mono text-sm text-muted-foreground glass px-3 py-1.5 rounded-xl">
              X: {currentPosition.x.toFixed(0)} | Y: {currentPosition.y.toFixed(0)}
            </div>
          )}
       </div>
     );
   }
 );
 
 RecordingCanvas.displayName = 'RecordingCanvas';