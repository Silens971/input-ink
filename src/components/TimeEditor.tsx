 import { TimeSettings, SegmentSelection } from '@/types/recording';
 import { Slider } from '@/components/ui/slider';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Clock, Zap, Turtle, RotateCcw, Timer } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface TimeEditorProps {
   timeSettings: TimeSettings;
   segments: SegmentSelection[];
   selectedSegment: number | null;
   onUpdateMultiplier: (multiplier: number) => void;
   onSetTargetDuration: (ms: number) => void;
   onResetToOriginal: () => void;
   onUpdateSegmentMultiplier: (index: number, multiplier: number) => void;
   onSelectSegment: (index: number | null) => void;
   onRemoveSegment: (index: number) => void;
 }
 
 const TIME_PRESETS = [
   { label: '0.25x', value: 0.25, icon: Turtle },
   { label: '0.5x', value: 0.5, icon: Turtle },
   { label: '1x', value: 1, icon: Clock },
   { label: '2x', value: 2, icon: Zap },
   { label: '4x', value: 4, icon: Zap },
 ];
 
 export function TimeEditor({
   timeSettings,
   segments,
   selectedSegment,
   onUpdateMultiplier,
   onSetTargetDuration,
   onResetToOriginal,
   onUpdateSegmentMultiplier,
   onSelectSegment,
   onRemoveSegment,
 }: TimeEditorProps) {
   const formatDuration = (ms: number) => {
     if (ms < 1000) return `${ms}ms`;
     return `${(ms / 1000).toFixed(2)}s`;
   };
 
   const handleDurationInput = (value: string) => {
     const ms = parseFloat(value) * 1000;
     if (!isNaN(ms) && ms > 0) {
       onSetTargetDuration(ms);
     }
   };
 
    return (
      <div className="glass-card rounded-2xl p-6 space-y-6 fade-in">
       <div className="flex items-center justify-between">
         <h3 className="font-semibold text-lg flex items-center gap-2">
           <Timer className="w-5 h-5 text-primary" />
           Controle de Tempo
         </h3>
         <Button variant="ghost" size="sm" onClick={onResetToOriginal}>
           <RotateCcw className="w-4 h-4 mr-2" />
           Resetar
         </Button>
       </div>
 
        {/* Time comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 glass rounded-xl text-center">
            <div className="text-xs text-muted-foreground mb-1">Tempo Original</div>
            <div className="text-xl font-mono font-bold">
              {formatDuration(timeSettings.originalDuration)}
            </div>
          </div>
          <div className={cn(
            "p-4 rounded-xl text-center transition-all duration-300 glass",
            timeSettings.timeMultiplier !== 1 
              ? "ring-2 ring-primary/50" 
              : ""
         )}>
           <div className="text-xs text-muted-foreground mb-1">Tempo Ajustado</div>
           <div className={cn(
             "text-xl font-mono font-bold transition-colors",
             timeSettings.timeMultiplier !== 1 && "text-primary"
           )}>
             {formatDuration(timeSettings.adjustedDuration)}
           </div>
         </div>
       </div>
 
       {/* Global multiplier slider */}
       <div className="space-y-3">
         <div className="flex items-center justify-between">
           <span className="text-sm font-medium flex items-center gap-2">
             <Clock className="w-4 h-4 text-muted-foreground" />
             Multiplicador Global
           </span>
           <span className={cn(
             "font-mono text-sm px-2 py-1 rounded transition-all",
             timeSettings.timeMultiplier !== 1 && "bg-primary/20 text-primary"
           )}>
             {timeSettings.timeMultiplier.toFixed(2)}x
           </span>
         </div>
         <Slider
           value={[timeSettings.timeMultiplier]}
           onValueChange={([v]) => onUpdateMultiplier(v)}
           min={0.1}
           max={5}
           step={0.05}
           className="py-2"
         />
         <div className="flex justify-between text-xs text-muted-foreground">
           <span>Mais lento (0.1x)</span>
           <span>Mais rápido (5x)</span>
         </div>
       </div>
 
       {/* Presets */}
       <div className="space-y-2">
         <span className="text-sm font-medium">Presets</span>
         <div className="grid grid-cols-5 gap-2">
           {TIME_PRESETS.map((preset) => {
             const Icon = preset.icon;
             const isActive = Math.abs(timeSettings.timeMultiplier - preset.value) < 0.01;
             return (
               <Button
                 key={preset.value}
                 variant={isActive ? "default" : "secondary"}
                 size="sm"
                 onClick={() => onUpdateMultiplier(preset.value)}
                 className={cn(
                   "flex flex-col h-auto py-2 gap-1",
                   isActive && "ring-2 ring-primary"
                 )}
               >
                 <Icon className="w-4 h-4" />
                 <span className="text-xs">{preset.label}</span>
               </Button>
             );
           })}
         </div>
       </div>
 
       {/* Direct duration input */}
       <div className="space-y-2">
         <span className="text-sm font-medium">Definir Duração Alvo</span>
         <div className="flex gap-2">
            <Input
              type="number"
              id="target-duration-input"
              name="target-duration"
              step="0.1"
              min="0.1"
              placeholder="Segundos"
              className="font-mono"
              onChange={(e) => handleDurationInput(e.target.value)}
            />
           <span className="flex items-center text-sm text-muted-foreground">segundos</span>
         </div>
       </div>
 
       {/* Segments (advanced) */}
        {segments.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/50">
            <span className="text-sm font-medium">Segmentos Selecionados</span>
           <div className="space-y-2">
             {segments.map((seg, index) => (
               <div
                 key={index}
                 className={cn(
                   "p-3 rounded-lg border transition-all cursor-pointer",
                   selectedSegment === index 
                     ? "border-primary bg-primary/10" 
                     : "border-border bg-secondary/30 hover:bg-secondary/50"
                 )}
                 onClick={() => onSelectSegment(selectedSegment === index ? null : index)}
               >
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs text-muted-foreground">
                     Pontos {seg.startIndex} - {seg.endIndex}
                   </span>
                   <Button
                     variant="ghost"
                     size="sm"
                     className="h-6 px-2 text-xs"
                     onClick={(e) => {
                       e.stopPropagation();
                       onRemoveSegment(index);
                     }}
                   >
                     Remover
                   </Button>
                 </div>
                 <div className="flex items-center gap-2">
                   <Slider
                     value={[seg.timeMultiplier]}
                     onValueChange={([v]) => onUpdateSegmentMultiplier(index, v)}
                     min={0.1}
                     max={5}
                     step={0.1}
                     className="flex-1"
                   />
                   <span className="font-mono text-xs w-12 text-right">
                     {seg.timeMultiplier.toFixed(1)}x
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }