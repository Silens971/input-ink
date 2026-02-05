 import { useState, useEffect, useCallback } from 'react';
 import { KeyboardShortcuts } from '@/types/recording';
 
 const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
   startRecording: 'F2',
   stopRecording: 'F3',
 };
 
 export function useKeyboardShortcuts(
   onStartRecording: () => void,
   onStopRecording: () => void,
   isRecording: boolean
 ) {
   const [shortcuts, setShortcuts] = useState<KeyboardShortcuts>(() => {
     const saved = localStorage.getItem('mouseRecorderShortcuts');
     return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
   });
   
   const [isConfiguring, setIsConfiguring] = useState<'start' | 'stop' | null>(null);
 
   const handleKeyDown = useCallback((e: KeyboardEvent) => {
     if (isConfiguring) {
       e.preventDefault();
       const key = e.key === ' ' ? 'Space' : e.key;
       
       setShortcuts(prev => {
         const updated = {
           ...prev,
           [isConfiguring === 'start' ? 'startRecording' : 'stopRecording']: key,
         };
         localStorage.setItem('mouseRecorderShortcuts', JSON.stringify(updated));
         return updated;
       });
       
       setIsConfiguring(null);
       return;
     }
     
     const key = e.key === ' ' ? 'Space' : e.key;
     
     if (key === shortcuts.startRecording && !isRecording) {
       e.preventDefault();
       onStartRecording();
     } else if (key === shortcuts.stopRecording && isRecording) {
       e.preventDefault();
       onStopRecording();
     }
   }, [shortcuts, isRecording, isConfiguring, onStartRecording, onStopRecording]);
 
   useEffect(() => {
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [handleKeyDown]);
 
   return {
     shortcuts,
     isConfiguring,
     setIsConfiguring,
   };
 }