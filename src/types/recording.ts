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

export interface TimeSettings {
  timeMultiplier: number;
  originalDuration: number;
  adjustedDuration: number;
}

export interface SegmentSelection {
  startIndex: number;
  endIndex: number;
  timeMultiplier: number;
}

export interface MacroState {
  originalPoints: MousePoint[];
  editedPoints: MousePoint[];
  originalDuration: number;
  editSettings: EditSettings;
  timeSettings: TimeSettings;
  segments: SegmentSelection[];
  selectedSegment: number | null;
}

export interface ExecutionShortcut {
  type: 'keyboard' | 'mouse';
  key: string;
}

export interface DerivedMacroData {
  points: MousePoint[];
  duration: number;
  pointCount: number;
  averageSpeed: number;
  codeAHK: string;
  codeLua: string;
}