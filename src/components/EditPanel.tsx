import { EditSettings } from '@/types/recording';
 import { Slider } from '@/components/ui/slider';
 import { Button } from '@/components/ui/button';
import { Scissors, Scale, Wand2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
 
interface EditPanelProps {
  editSettings: EditSettings;
  onUpdateSetting: <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => void;
  onReset: () => void;
}
 
export function EditPanel({ editSettings, onUpdateSetting, onReset }: EditPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const hasChanges = 
    editSettings.scaleX !== 1 || 
    editSettings.scaleY !== 1 || 
    editSettings.smoothing !== 0 ||
    editSettings.trimStart !== 0 ||
    editSettings.trimEnd !== 100;

   return (
    <div className="bg-card rounded-xl border border-border fade-in overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <h3 className="font-semibold flex items-center gap-2">
           <Wand2 className="w-5 h-5 text-primary" />
           Editar Movimentos
          {hasChanges && (
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
              Modificado
            </span>
          )}
         </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      )}>
        <div className="p-6 pt-2 space-y-6">
          {/* Reset button */}
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={onReset} className="w-full gap-2">
              <RotateCcw className="w-4 h-4" />
              Resetar Alterações Espaciais
            </Button>
          )}

          {/* Trim */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Scissors className="w-4 h-4 text-muted-foreground" />
              Cortar
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Início: {editSettings.trimStart.toFixed(0)}%</span>
                <span>Fim: {editSettings.trimEnd.toFixed(0)}%</span>
              </div>
              <div className="flex gap-4">
                <Slider
                  value={[editSettings.trimStart]}
                  onValueChange={([v]) => onUpdateSetting('trimStart', Math.min(v, editSettings.trimEnd - 1))}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Slider
                  value={[editSettings.trimEnd]}
                  onValueChange={([v]) => onUpdateSetting('trimEnd', Math.max(v, editSettings.trimStart + 1))}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Scale className="w-4 h-4 text-muted-foreground" />
              Escala
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Escala X</span>
                  <span className={cn(
                    "font-mono",
                    editSettings.scaleX !== 1 && "text-primary"
                  )}>
                    {editSettings.scaleX.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[editSettings.scaleX]}
                  onValueChange={([v]) => onUpdateSetting('scaleX', v)}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Escala Y</span>
                  <span className={cn(
                    "font-mono",
                    editSettings.scaleY !== 1 && "text-primary"
                  )}>
                    {editSettings.scaleY.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[editSettings.scaleY]}
                  onValueChange={([v]) => onUpdateSetting('scaleY', v)}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>
            </div>
          </div>

          {/* Smoothing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wand2 className="w-4 h-4 text-muted-foreground" />
              Suavização
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Intensidade</span>
                <span className={cn(
                  "font-mono",
                  editSettings.smoothing !== 0 && "text-primary"
                )}>
                  {(editSettings.smoothing * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[editSettings.smoothing]}
                onValueChange={([v]) => onUpdateSetting('smoothing', v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>
         </div>
      </div>
     </div>
   );
 }