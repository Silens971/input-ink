 import { useState, useCallback, useRef, useEffect } from 'react';
 import { MousePoint, RecordingData, RecordingState } from '@/types/recording';
 
 export function useMouseRecorder() {
   const [state, setState] = useState<RecordingState>('idle');
   const [points, setPoints] = useState<MousePoint[]>([]);
   const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
   const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
   
   const canvasRef = useRef<HTMLDivElement>(null);
   const startTimeRef = useRef<number>(0);
   const centerRef = useRef({ x: 0, y: 0 });
 
   const updateCenter = useCallback(() => {
     if (canvasRef.current) {
       const rect = canvasRef.current.getBoundingClientRect();
       centerRef.current = {
         x: rect.left + rect.width / 2,
         y: rect.top + rect.height / 2,
       };
     }
   }, []);
 
   const handleMouseMove = useCallback((e: MouseEvent) => {
     if (state !== 'recording') return;
     
     const relativeX = e.clientX - centerRef.current.x;
     const relativeY = -(e.clientY - centerRef.current.y); // Invert Y for standard coordinate system
     
     const point: MousePoint = {
       x: relativeX,
       y: relativeY,
       timestamp: Date.now() - startTimeRef.current,
     };
     
     setPoints(prev => [...prev, point]);
     setCurrentPosition({ x: relativeX, y: relativeY });
   }, [state]);
 
   const startRecording = useCallback(() => {
     updateCenter();
     setPoints([]);
     setRecordingData(null);
     startTimeRef.current = Date.now();
     setState('recording');
   }, [updateCenter]);
 
   const stopRecording = useCallback(() => {
     if (state !== 'recording') return;
     
     const endTime = Date.now();
     const duration = endTime - startTimeRef.current;
     
     setRecordingData({
       points: [...points],
       startTime: startTimeRef.current,
       endTime,
       duration,
     });
     
     setState('completed');
   }, [state, points]);
 
  const reset = useCallback(() => {
    setPoints([]);
    setRecordingData(null);
    setCurrentPosition({ x: 0, y: 0 });
    setState('idle');
  }, []);

  const importRecording = useCallback((data: RecordingData) => {
    setPoints(data.points);
    setRecordingData(data);
    setCurrentPosition({ x: 0, y: 0 });
    setState('completed');
  }, []);
 
   useEffect(() => {
     if (state === 'recording') {
       window.addEventListener('mousemove', handleMouseMove);
       return () => window.removeEventListener('mousemove', handleMouseMove);
     }
   }, [state, handleMouseMove]);
 
   useEffect(() => {
     updateCenter();
     window.addEventListener('resize', updateCenter);
     return () => window.removeEventListener('resize', updateCenter);
   }, [updateCenter]);
 
  return {
    state,
    points,
    recordingData,
    currentPosition,
    canvasRef,
    startRecording,
    stopRecording,
    reset,
    importRecording,
    setRecordingData,
  };
}