import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ImagePlus, Lock, Unlock, Trash2, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceImageState {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  locked: boolean;
}

interface ReferenceImageProps {
  canvasSize: number;
}

export function ReferenceImage({ canvasSize }: ReferenceImageProps) {
  const [image, setImage] = useState<ReferenceImageState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Scale image to fit in canvas
        const maxSize = canvasSize * 0.6;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        setImage({
          src: event.target?.result as string,
          x: (canvasSize - width) / 2,
          y: (canvasSize - height) / 2,
          width,
          height,
          opacity: 0.5,
          locked: false,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!image || image.locked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).closest('.reference-container')?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - image.x,
      y: e.clientY - image.y,
    });
  }, [image]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!image || !isDragging) return;
    
    setImage(prev => prev ? {
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    } : null);
  }, [image, isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!image || image.locked) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [image]);

  const handleResize = useCallback((e: React.MouseEvent) => {
    if (!image || !isResizing) return;
    
    const deltaX = e.clientX - dragStart.x;
    const aspectRatio = image.width / image.height;
    
    setImage(prev => prev ? {
      ...prev,
      width: Math.max(50, prev.width + deltaX),
      height: Math.max(50, (prev.width + deltaX) / aspectRatio),
    } : null);
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [image, isResizing, dragStart]);

  const toggleLock = () => {
    setImage(prev => prev ? { ...prev, locked: !prev.locked } : null);
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateOpacity = (value: number[]) => {
    setImage(prev => prev ? { ...prev, opacity: value[0] } : null);
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="glass-button gap-2"
        >
          <ImagePlus className="w-4 h-4" />
          {image ? 'Trocar' : 'Imagem Guia'}
        </Button>

        {image && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLock}
              className={cn(
                "glass-button gap-2",
                image.locked && "bg-primary/20 border-primary/30"
              )}
            >
              {image.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {image.locked ? 'Travada' : 'Travar'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={removeImage}
              className="glass-button gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Opacidade</span>
              <Slider
                value={[image.opacity]}
                onValueChange={updateOpacity}
                min={0.1}
                max={1}
                step={0.05}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground w-8">
                {Math.round(image.opacity * 100)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Image overlay info */}
      {image && !image.locked && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Move className="w-3 h-3" />
          <span>Arraste para mover • Canto para redimensionar</span>
        </div>
      )}

      {/* Overlay component for canvas */}
      {image && (
        <div 
          className="reference-container absolute inset-0 pointer-events-none"
          style={{ zIndex: 5 }}
          onMouseMove={(e) => {
            if (isDragging) handleMouseMove(e);
            if (isResizing) handleResize(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className={cn(
              "absolute transition-shadow",
              !image.locked && "pointer-events-auto cursor-move",
              isDragging && "ring-2 ring-primary/50"
            )}
            style={{
              left: image.x,
              top: image.y,
              width: image.width,
              height: image.height,
              opacity: image.opacity,
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={image.src}
              alt="Reference"
              className="w-full h-full object-contain select-none"
              draggable={false}
            />
            
            {/* Resize handle */}
            {!image.locked && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-primary/80 cursor-se-resize pointer-events-auto rounded-tl"
                onMouseDown={handleResizeStart}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export just the controls for the panel
export function ReferenceImageControls({ 
  onImageLoad,
  imageState,
  onUpdateOpacity,
  onToggleLock,
  onRemove,
}: {
  onImageLoad: (src: string, width: number, height: number) => void;
  imageState: { opacity: number; locked: boolean } | null;
  onUpdateOpacity: (opacity: number) => void;
  onToggleLock: () => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        onImageLoad(event.target?.result as string, img.width, img.height);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="glass-button gap-2"
      >
        <ImagePlus className="w-4 h-4" />
        {imageState ? 'Trocar' : 'Imagem Guia'}
      </Button>

      {imageState && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleLock}
            className={cn(
              "glass-button gap-2",
              imageState.locked && "bg-primary/20 border-primary/30"
            )}
          >
            {imageState.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="glass-button gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Opacidade</span>
            <Slider
              value={[imageState.opacity]}
              onValueChange={(v) => onUpdateOpacity(v[0])}
              min={0.1}
              max={1}
              step={0.05}
              className="w-20"
            />
          </div>
        </>
      )}
    </div>
  );
}
