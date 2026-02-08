import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RecordingData } from '@/types/recording';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';

interface TrajectoryViewerProps {
  recordingData: RecordingData;
}

// Generate color from cold (blue) to hot (red)
function getGradientColor(progress: number): string {
  // progress: 0 = cold (blue), 1 = hot (red)
  // Using HSL: 200 (blue) -> 30 (orange) -> 350 (red)
  
  if (progress < 0.5) {
    // Blue to orange (0 to 0.5)
    const hue = 200 - (progress * 2) * 170; // 200 -> 30
    const saturation = 85 + progress * 10;
    const lightness = 55 + progress * 5;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  } else {
    // Orange to red (0.5 to 1)
    const t = (progress - 0.5) * 2;
    const hue = 30 - t * 40; // 30 -> -10 (350)
    const saturation = 90 + t * 5;
    const lightness = 55 - t * 5;
    return `hsl(${hue < 0 ? 360 + hue : hue}, ${saturation}%, ${lightness}%)`;
  }
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

  // Generate gradient segments for thermal coloring
  const trajectorySegments = useMemo(() => {
    if (recordingData.points.length < 2) return null;

    const segments = [];
    const points = recordingData.points;
    
    for (let i = 0; i < points.length - 1; i++) {
      const progress = i / (points.length - 1);
      const x1 = center + points[i].x * scale;
      const y1 = center - points[i].y * scale;
      const x2 = center + points[i + 1].x * scale;
      const y2 = center - points[i + 1].y * scale;
      
      const color = getGradientColor(progress);
      
      segments.push(
        <line
          key={`seg-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={3 / zoom}
          strokeLinecap="round"
        />
      );
    }

    return segments;
  }, [recordingData.points, center, scale, zoom]);

  const renderTrajectory = () => {
    if (recordingData.points.length < 2) return null;

    const points = recordingData.points;
    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    return (
      <>
        {/* Glow layer */}
        <g opacity={0.3} filter="blur(3px)">
          {trajectorySegments}
        </g>
        
        {/* Main trajectory with gradient */}
        {trajectorySegments}
        
        {/* Start point - cold blue */}
        <circle
          cx={center + startPoint.x * scale}
          cy={center - startPoint.y * scale}
          r={8 / zoom}
          fill="hsl(200, 90%, 55%)"
          stroke="hsl(200, 90%, 75%)"
          strokeWidth={2 / zoom}
        />
        
        {/* End point - hot red */}
        <circle
          cx={center + endPoint.x * scale}
          cy={center - endPoint.y * scale}
          r={8 / zoom}
          fill="hsl(350, 90%, 55%)"
          stroke="hsl(350, 90%, 75%)"
          strokeWidth={2 / zoom}
        />
      </>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Visualização da Trajetória</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
            className="glass-button"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}
            className="glass-button"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={resetView} className="glass-button">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-canvas cursor-grab active:cursor-grabbing"
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

        {/* Thermal Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs glass px-3 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(200, 90%, 55%)' }} />
            <span className="text-muted-foreground">Início (frio)</span>
          </div>
          <div className="w-12 h-2 rounded-full" style={{ 
            background: 'linear-gradient(to right, hsl(200, 90%, 55%), hsl(30, 95%, 55%), hsl(350, 90%, 55%))' 
          }} />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(350, 90%, 55%)' }} />
            <span className="text-muted-foreground">Fim (quente)</span>
          </div>
        </div>

        {/* Controls hint */}
        <div className="absolute top-3 right-3 flex items-center gap-2 text-xs text-muted-foreground glass px-3 py-2 rounded-xl">
          <Move className="w-3 h-3" />
          <span>Arraste para mover • Scroll para zoom</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 glass rounded-xl">
          <div className="text-2xl font-bold text-primary">{recordingData.points.length}</div>
          <div className="text-xs text-muted-foreground">Pontos</div>
        </div>
        <div className="text-center p-3 glass rounded-xl">
          <div className="text-2xl font-bold text-primary">{(recordingData.duration / 1000).toFixed(1)}s</div>
          <div className="text-xs text-muted-foreground">Duração</div>
        </div>
        <div className="text-center p-3 glass rounded-xl">
          <div className="text-2xl font-bold text-primary">{(maxExtent * 2).toFixed(0)}px</div>
          <div className="text-xs text-muted-foreground">Extensão</div>
        </div>
        <div className="text-center p-3 glass rounded-xl">
          <div className="text-2xl font-bold text-primary">{zoom.toFixed(1)}x</div>
          <div className="text-xs text-muted-foreground">Zoom</div>
        </div>
      </div>
    </div>
  );
}
