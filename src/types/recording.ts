 export interface MousePoint {
   x: number;
   y: number;
   timestamp: number;
 }
 
 export interface RecordingData {
   points: MousePoint[];
   startTime: number;
   endTime: number;
   duration: number;
 }
 
 export interface KeyboardShortcuts {
   startRecording: string;
   stopRecording: string;
 }
 
 export type RecordingState = 'idle' | 'recording' | 'completed';
 
 export interface EditSettings {
   scaleX: number;
   scaleY: number;
   smoothing: number;
   trimStart: number;
   trimEnd: number;
 }