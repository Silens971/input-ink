 import { useState, useEffect, useRef } from 'react';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Download, Copy, Check, Code, Sparkles } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface LiveCodePreviewProps {
   codeAHK: string;
   codeLua: string;
   duration: number;
   pointCount: number;
 }
 
 export function LiveCodePreview({ codeAHK, codeLua, duration, pointCount }: LiveCodePreviewProps) {
   const [activeTab, setActiveTab] = useState('ahk');
   const [copied, setCopied] = useState(false);
   const [hasChanged, setHasChanged] = useState(false);
   const prevCodeRef = useRef({ ahk: '', lua: '' });
 
   // Detect code changes for visual feedback
   useEffect(() => {
     const currentCode = activeTab === 'ahk' ? codeAHK : codeLua;
     const prevCode = activeTab === 'ahk' ? prevCodeRef.current.ahk : prevCodeRef.current.lua;
     
     if (currentCode !== prevCode && prevCode !== '') {
       setHasChanged(true);
       const timer = setTimeout(() => setHasChanged(false), 500);
       return () => clearTimeout(timer);
     }
     
     prevCodeRef.current = { ahk: codeAHK, lua: codeLua };
   }, [codeAHK, codeLua, activeTab]);
 
   const getCode = () => activeTab === 'ahk' ? codeAHK : codeLua;
 
   const copyToClipboard = async () => {
     await navigator.clipboard.writeText(getCode());
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
   };
 
   const downloadFile = () => {
     const code = getCode();
     const extension = activeTab === 'ahk' ? 'ahk' : 'lua';
     
     const blob = new Blob([code], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `mouse_movement.${extension}`;
     a.click();
     URL.revokeObjectURL(url);
   };
 
   const formatDuration = (ms: number) => {
     if (ms < 1000) return `${ms}ms`;
     return `${(ms / 1000).toFixed(2)}s`;
   };
 
   return (
     <div className="bg-card rounded-xl p-6 space-y-4 border border-border fade-in">
       <div className="flex items-center justify-between">
         <h3 className="font-semibold text-lg flex items-center gap-2">
           <Code className="w-5 h-5 text-primary" />
           Código ao Vivo
           {hasChanged && (
             <Sparkles className="w-4 h-4 text-primary animate-pulse" />
           )}
         </h3>
         <div className="flex items-center gap-2 text-xs text-muted-foreground">
           <span className="px-2 py-1 bg-secondary/50 rounded font-mono">
             {pointCount} pts
           </span>
           <span className="px-2 py-1 bg-secondary/50 rounded font-mono">
             {formatDuration(duration)}
           </span>
         </div>
       </div>
 
       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid w-full grid-cols-2">
           <TabsTrigger value="ahk">AutoHotkey</TabsTrigger>
           <TabsTrigger value="lua">Lua</TabsTrigger>
         </TabsList>
 
         <TabsContent value="ahk" className="mt-4">
           <div 
             className={cn(
               "bg-muted rounded-lg p-4 max-h-80 overflow-auto transition-all duration-300",
               hasChanged && "ring-2 ring-primary/50 bg-primary/5"
             )}
           >
             <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
               {codeAHK}
             </pre>
           </div>
         </TabsContent>
 
         <TabsContent value="lua" className="mt-4">
           <div 
             className={cn(
               "bg-muted rounded-lg p-4 max-h-80 overflow-auto transition-all duration-300",
               hasChanged && "ring-2 ring-primary/50 bg-primary/5"
             )}
           >
             <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
               {codeLua}
             </pre>
           </div>
         </TabsContent>
       </Tabs>
 
       <div className="flex gap-3">
         <Button onClick={copyToClipboard} variant="secondary" className="flex-1 gap-2">
           {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
           {copied ? 'Copiado!' : 'Copiar'}
         </Button>
         <Button onClick={downloadFile} className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
           <Download className="w-4 h-4" />
           Baixar
         </Button>
       </div>
 
       <p className="text-xs text-muted-foreground text-center">
         O código reflete exatamente o estado atual das edições
       </p>
     </div>
   );
 }