 import { useState, useEffect } from 'react';
 import { RecordingData, EditSettings, MousePoint } from '@/types/recording';
 import { Slider } from '@/components/ui/slider';
 import { Button } from '@/components/ui/button';
 import { Scissors, Scale, Wand2, RotateCcw } from 'lucide-react';
 
 interface EditPanelProps {
   recordingData: RecordingData;
   onApplyEdits: (editedData: RecordingData) => void;
 }
 
 const DEFAULT_SETTINGS: EditSettings = {
   scaleX: 1,
   scaleY: 1,
   smoothing: 0,
   trimStart: 0,
   trimEnd: 100,
 };
 
 export function EditPanel({ recordingData, onApplyEdits }: EditPanelProps) {
   const [settings, setSettings] = useState<EditSettings>(DEFAULT_SETTINGS);
   const [isExpanded, setIsExpanded] = useState(false);
 
   const applyEdits = () => {
     let points = [...recordingData.points];
     
     // Apply trim
     const startIdx = Math.floor((settings.trimStart / 100) * points.length);
     const endIdx = Math.ceil((settings.trimEnd / 100) * points.length);
     points = points.slice(startIdx, endIdx);
     
     // Apply scale
     points = points.map(p => ({
       ...p,
       x: p.x * settings.scaleX,
       y: p.y * settings.scaleY,
     }));
     
     // Apply smoothing (simple moving average)
     if (settings.smoothing > 0) {
       const windowSize = Math.ceil(settings.smoothing * 5) + 1;
       points = smoothPoints(points, windowSize);
     }
     
     // Normalize timestamps
     if (points.length > 0) {
       const startTime = points[0].timestamp;
       points = points.map(p => ({
         ...p,
         timestamp: p.timestamp - startTime,
       }));
     }
     
     const duration = points.length > 0 
       ? points[points.length - 1].timestamp - points[0].timestamp 
       : 0;
     
     onApplyEdits({
       ...recordingData,
       points,
       duration,
     });
   };
 
   const smoothPoints = (points: MousePoint[], windowSize: number): MousePoint[] => {
     return points.map((point, i) => {
       const start = Math.max(0, i - Math.floor(windowSize / 2));
       const end = Math.min(points.length, i + Math.floor(windowSize / 2) + 1);
       const window = points.slice(start, end);
       
       return {
         ...point,
         x: window.reduce((sum, p) => sum + p.x, 0) / window.length,
         y: window.reduce((sum, p) => sum + p.y, 0) / window.length,
       };
     });
   };
 
   const resetSettings = () => {
     setSettings(DEFAULT_SETTINGS);
   };
 
   useEffect(() => {
     applyEdits();
   }, [settings]);
 
   if (!isExpanded) {
     return (
       <Button
         onClick={() => setIsExpanded(true)}
         variant="secondary"
         className="w-full gap-2"
       >
         <Wand2 className="w-4 h-4" />
         Editar Movimentos
       </Button>
     );
   }
 
   return (
     <div className="bg-card rounded-xl p-6 space-y-6 border border-border fade-in">
       <div className="flex items-center justify-between">
         <h3 className="font-semibold text-lg flex items-center gap-2">
           <Wand2 className="w-5 h-5 text-primary" />
           Editar Movimentos
         </h3>
         <Button variant="ghost" size="sm" onClick={resetSettings}>
           <RotateCcw className="w-4 h-4 mr-2" />
           Resetar
         </Button>
       </div>
 
       {/* Trim */}
       <div className="space-y-3">
         <div className="flex items-center gap-2 text-sm font-medium">
           <Scissors className="w-4 h-4 text-muted-foreground" />
           Cortar
         </div>
         <div className="space-y-2">
           <div className="flex justify-between text-xs text-muted-foreground">
             <span>Início: {settings.trimStart.toFixed(0)}%</span>
             <span>Fim: {settings.trimEnd.toFixed(0)}%</span>
           </div>
           <div className="flex gap-4">
             <Slider
               value={[settings.trimStart]}
               onValueChange={([v]) => setSettings(s => ({ ...s, trimStart: Math.min(v, s.trimEnd - 1) }))}
               max={100}
               step={1}
               className="flex-1"
             />
             <Slider
               value={[settings.trimEnd]}
               onValueChange={([v]) => setSettings(s => ({ ...s, trimEnd: Math.max(v, s.trimStart + 1) }))}
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
               <span>{settings.scaleX.toFixed(2)}x</span>
             </div>
             <Slider
               value={[settings.scaleX]}
               onValueChange={([v]) => setSettings(s => ({ ...s, scaleX: v }))}
               min={0.1}
               max={3}
               step={0.1}
             />
           </div>
           <div className="space-y-2">
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>Escala Y</span>
               <span>{settings.scaleY.toFixed(2)}x</span>
             </div>
             <Slider
               value={[settings.scaleY]}
               onValueChange={([v]) => setSettings(s => ({ ...s, scaleY: v }))}
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
             <span>{(settings.smoothing * 100).toFixed(0)}%</span>
           </div>
           <Slider
             value={[settings.smoothing]}
             onValueChange={([v]) => setSettings(s => ({ ...s, smoothing: v }))}
             min={0}
             max={1}
             step={0.05}
           />
         </div>
       </div>
 
       <Button
         onClick={() => setIsExpanded(false)}
         variant="outline"
         className="w-full"
       >
         Fechar
       </Button>
     </div>
   );
 }