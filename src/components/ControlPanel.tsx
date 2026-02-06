 import { RecordingState, KeyboardShortcuts } from '@/types/recording';
 import { Button } from '@/components/ui/button';
 import { Play, Square, RotateCcw, Keyboard } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface ControlPanelProps {
   state: RecordingState;
   duration: number;
   pointCount: number;
   shortcuts: KeyboardShortcuts;
   isConfiguring: 'start' | 'stop' | null;
   onStart: () => void;
   onStop: () => void;
   onReset: () => void;
   onConfigureShortcut: (type: 'start' | 'stop') => void;
 }
 
 export function ControlPanel({
   state,
   duration,
   pointCount,
   shortcuts,
   isConfiguring,
   onStart,
   onStop,
   onReset,
   onConfigureShortcut,
 }: ControlPanelProps) {
   const formatDuration = (ms: number) => {
     const seconds = Math.floor(ms / 1000);
     const minutes = Math.floor(seconds / 60);
     const remainingSeconds = seconds % 60;
     const remainingMs = ms % 1000;
     
     if (minutes > 0) {
       return `${minutes}m ${remainingSeconds}s`;
     }
     return `${seconds}.${Math.floor(remainingMs / 100)}s`;
   };
 
    return (
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                state === 'idle' && 'bg-muted-foreground',
                state === 'recording' && 'bg-recording recording-pulse',
                state === 'completed' && 'bg-success'
              )}
           />
           <span className="font-medium text-lg">
             {state === 'idle' && 'Pronto para gravar'}
             {state === 'recording' && 'Gravando...'}
             {state === 'completed' && 'Gravação concluída'}
           </span>
         </div>
         
         {(state === 'recording' || state === 'completed') && (
           <div className="font-mono text-muted-foreground">
             {formatDuration(duration)} • {pointCount} pontos
           </div>
         )}
       </div>
 
       {/* Main controls */}
       <div className="flex gap-3">
         {state === 'idle' && (
           <Button
             onClick={onStart}
             size="lg"
             className="flex-1 h-14 text-lg gap-3 bg-primary hover:bg-primary/90 text-primary-foreground"
           >
             <Play className="w-5 h-5" />
             Iniciar Gravação
           </Button>
         )}
 
         {state === 'recording' && (
           <Button
             onClick={onStop}
             size="lg"
             variant="destructive"
             className="flex-1 h-14 text-lg gap-3"
           >
             <Square className="w-5 h-5" />
             Finalizar Gravação
           </Button>
         )}
 
         {state === 'completed' && (
           <>
             <Button
               onClick={onStart}
               size="lg"
               className="flex-1 h-14 text-lg gap-3 bg-primary hover:bg-primary/90 text-primary-foreground"
             >
               <Play className="w-5 h-5" />
               Nova Gravação
             </Button>
             <Button
               onClick={onReset}
               size="lg"
               variant="secondary"
               className="h-14 px-6"
             >
               <RotateCcw className="w-5 h-5" />
             </Button>
           </>
         )}
       </div>
 
        {/* Keyboard shortcuts */}
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Keyboard className="w-4 h-4" />
            <span className="text-sm font-medium">Atalhos de Teclado</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onConfigureShortcut('start')}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl transition-all',
                'glass-button',
                isConfiguring === 'start' && 'ring-2 ring-primary'
              )}
            >
              <span className="text-sm text-muted-foreground">Iniciar</span>
              <kbd className="px-2 py-1 glass rounded-lg text-sm font-mono">
                {isConfiguring === 'start' ? '...' : shortcuts.startRecording}
              </kbd>
           </button>
           
            <button
              onClick={() => onConfigureShortcut('stop')}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl transition-all',
                'glass-button',
                isConfiguring === 'stop' && 'ring-2 ring-primary'
              )}
            >
              <span className="text-sm text-muted-foreground">Finalizar</span>
              <kbd className="px-2 py-1 glass rounded-lg text-sm font-mono">
                {isConfiguring === 'stop' ? '...' : shortcuts.stopRecording}
              </kbd>
            </button>
          </div>
         
         <p className="text-xs text-muted-foreground mt-2">
           Clique em um atalho para configurar
         </p>
       </div>
     </div>
   );
 }