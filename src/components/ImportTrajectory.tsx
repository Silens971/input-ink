import { useState, useCallback } from 'react';
import { Upload, FileCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MousePoint, RecordingData } from '@/types/recording';
import { cn } from '@/lib/utils';

interface ImportTrajectoryProps {
  onImport: (data: RecordingData) => void;
}

function parseAHK(code: string): MousePoint[] | null {
  // Match pattern array: [[x,y,delay], ...]
  const patternMatch = code.match(/pattern\s*:=\s*\[([\s\S]*?)\]/);
  if (!patternMatch) return null;

  const content = patternMatch[1];
  const entryRegex = /\[\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(\d+)\s*\]/g;
  const points: MousePoint[] = [];
  let match: RegExpExecArray | null;
  let timestamp = 0;

  while ((match = entryRegex.exec(content)) !== null) {
    const delay = parseInt(match[3]);
    timestamp += delay;
    points.push({
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      timestamp,
    });
  }

  return points.length > 0 ? points : null;
}

function parseLua(code: string): MousePoint[] | null {
  // Match pattern table: {{x,y,delay}, ...}
  const patternMatch = code.match(/pattern\s*=\s*\{([\s\S]*?)\}\s*$/m);
  if (!patternMatch) {
    // Try alternative: find the full table
    const altMatch = code.match(/local\s+pattern\s*=\s*\{([\s\S]*?)\n\}/);
    if (!altMatch) return null;
    return parseLuaEntries(altMatch[1]);
  }
  return parseLuaEntries(patternMatch[1]);
}

function parseLuaEntries(content: string): MousePoint[] | null {
  const entryRegex = /\{\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(\d+)\s*\}/g;
  const points: MousePoint[] = [];
  let match: RegExpExecArray | null;
  let timestamp = 0;

  while ((match = entryRegex.exec(content)) !== null) {
    const delay = parseInt(match[3]);
    timestamp += delay;
    points.push({
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      timestamp,
    });
  }

  return points.length > 0 ? points : null;
}

export function ImportTrajectory({ onImport }: ImportTrajectoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(() => {
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Cole o código AHK ou Lua');
      return;
    }

    // Try AHK first, then Lua
    let points = parseAHK(trimmed);
    if (!points) {
      points = parseLua(trimmed);
    }

    if (!points || points.length < 2) {
      setError('Formato não reconhecido. Cole um script AHK v2 ou Lua com array pattern.');
      return;
    }

    const duration = points[points.length - 1].timestamp;
    const data: RecordingData = {
      points,
      startTime: 0,
      endTime: duration,
      duration,
    };

    onImport(data);
    setCode('');
    setIsOpen(false);
    setError(null);
  }, [code, onImport]);

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="gap-2 glass-button"
        onClick={() => setIsOpen(true)}
      >
        <Upload className="w-4 h-4" />
        Importar Trajetória
      </Button>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Importar Trajetória</span>
        </div>
        <button onClick={() => { setIsOpen(false); setError(null); }} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Cole um script AHK v2 ou Lua gerado por esta ferramenta. O array <code className="text-primary">pattern</code> será extraído e exibido no canvas.
      </p>

      <Textarea
        value={code}
        onChange={(e) => { setCode(e.target.value); setError(null); }}
        placeholder={`Exemplo AHK:\npattern := [\n  [10,20,0],[15,25,16],...\n]\n\nExemplo Lua:\nlocal pattern = {\n  {10,20,0},{15,25,16},...\n}`}
        className="font-mono text-xs h-32 bg-input/50 border-border/50 resize-none"
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <Button
        onClick={handleImport}
        size="sm"
        className="w-full gap-2"
      >
        <Upload className="w-4 h-4" />
        Importar e Visualizar
      </Button>
    </div>
  );
}
