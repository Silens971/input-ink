import { useState, useCallback, useMemo } from 'react';
import { MousePoint, RecordingData, EditSettings, TimeSettings, MacroState, DerivedMacroData, SegmentSelection, ExecutionShortcut } from '@/types/recording';

const DEFAULT_EDIT_SETTINGS: EditSettings = {
  scaleX: 1,
  scaleY: 1,
  smoothing: 0,
  trimStart: 0,
  trimEnd: 100,
};

const DEFAULT_TIME_SETTINGS: TimeSettings = {
  timeMultiplier: 1,
  originalDuration: 0,
  adjustedDuration: 0,
};

const DEFAULT_EXECUTION_SHORTCUT: ExecutionShortcut = {
  type: 'keyboard',
  key: 'F5',
};
 
export function useMacroEditor(recordingData: RecordingData | null) {
  const [editSettings, setEditSettings] = useState<EditSettings>(DEFAULT_EDIT_SETTINGS);
  const [timeSettings, setTimeSettings] = useState<TimeSettings>(DEFAULT_TIME_SETTINGS);
  const [segments, setSegments] = useState<SegmentSelection[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [executionShortcut, setExecutionShortcut] = useState<ExecutionShortcut>(DEFAULT_EXECUTION_SHORTCUT);
 
   // Initialize time settings when recording data changes
   const initializeFromRecording = useCallback((data: RecordingData) => {
     setTimeSettings({
       timeMultiplier: 1,
       originalDuration: data.duration,
       adjustedDuration: data.duration,
     });
     setEditSettings(DEFAULT_EDIT_SETTINGS);
     setSegments([]);
     setSelectedSegment(null);
   }, []);
 
   // Apply spatial edits (trim, scale, smooth)
   const applySpaceEdits = useCallback((points: MousePoint[]): MousePoint[] => {
     let result = [...points];
     
     // Apply trim
     const startIdx = Math.floor((editSettings.trimStart / 100) * result.length);
     const endIdx = Math.ceil((editSettings.trimEnd / 100) * result.length);
     result = result.slice(startIdx, endIdx);
     
     // Apply scale
     result = result.map(p => ({
       ...p,
       x: p.x * editSettings.scaleX,
       y: p.y * editSettings.scaleY,
     }));
     
     // Apply smoothing
     if (editSettings.smoothing > 0) {
       const windowSize = Math.ceil(editSettings.smoothing * 5) + 1;
       result = smoothPoints(result, windowSize);
     }
     
     return result;
   }, [editSettings]);
 
   // Apply time edits
   const applyTimeEdits = useCallback((points: MousePoint[]): MousePoint[] => {
     if (points.length === 0) return points;
     
     // First normalize timestamps to start from 0
     const startTime = points[0].timestamp;
     let result = points.map(p => ({
       ...p,
       timestamp: p.timestamp - startTime,
     }));
     
     // Apply segment-specific multipliers
     if (segments.length > 0) {
       result = applySegmentTimeMultipliers(result, segments);
     } else {
       // Apply global time multiplier
       result = result.map(p => ({
         ...p,
         timestamp: Math.round(p.timestamp / timeSettings.timeMultiplier),
       }));
     }
     
     return result;
   }, [timeSettings.timeMultiplier, segments]);
 
   const applySegmentTimeMultipliers = (points: MousePoint[], segs: SegmentSelection[]): MousePoint[] => {
     const result = [...points];
     let cumulativeAdjustment = 0;
     
     for (const seg of segs) {
       for (let i = seg.startIndex; i <= seg.endIndex && i < result.length; i++) {
         const prevTime = i > 0 ? points[i - 1].timestamp : 0;
         const originalDelta = points[i].timestamp - prevTime;
         const adjustedDelta = Math.round(originalDelta / seg.timeMultiplier);
         
         if (i >= seg.startIndex) {
           cumulativeAdjustment += originalDelta - adjustedDelta;
         }
         
         result[i] = {
           ...result[i],
           timestamp: result[i].timestamp - cumulativeAdjustment,
         };
       }
     }
     
     return result;
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
 
 // Generate AutoHotkey v2 code (hold-to-execute, interruptible)
 const generateAHK = useCallback((points: MousePoint[]): string => {
   if (points.length === 0) return '; No points recorded';
   
   // Build array entries: [dx, dy, delay]
   let lastTimestamp = 0;
   const entries: string[] = [];
   
   points.forEach((point, index) => {
     const delay = index > 0 ? Math.round(point.timestamp - lastTimestamp) : 0;
     lastTimestamp = point.timestamp;
     const x = Math.round(point.x);
     const y = Math.round(point.y);
     entries.push(`[${x},${y},${delay}]`);
   });
   
   // Break into rows of 6 entries for readability
   const entriesPerRow = 6;
   const rows: string[] = [];
   for (let i = 0; i < entries.length; i += entriesPerRow) {
     rows.push('  ' + entries.slice(i, i + entriesPerRow).join(','));
   }
   
   const duration = points.length > 0 ? Math.round(points[points.length - 1].timestamp) : 0;
   
   // Determine hotkey based on shortcut type
   const hotkey = executionShortcut.type === 'keyboard' 
     ? executionShortcut.key 
     : executionShortcut.key === '4' ? 'XButton1' : 'XButton2';
   
   const lines = [
     '; ===================================',
     '; Mouse Movement Script (AHK v2)',
     '; Generated by Mouse Motion Recorder',
     '; ===================================',
     '; Pontos: ' + points.length,
     '; Duração: ' + (duration / 1000).toFixed(2) + 's',
     '; Atalho: ' + hotkey + ' (segurar para executar)',
     '',
     '#Requires AutoHotkey v2.0',
     '#SingleInstance Force',
     'CoordMode "Mouse", "Screen"',
     '',
     'global isPlaying := false',
     '',
     'pattern := [',
     rows.join(',\n'),
     ']',
     '',
     'PlayPattern(p) {',
     '  global isPlaying',
     '  MouseGetPos(&startX, &startY)',
     '  for move in p {',
     '    if !isPlaying',
     '      return',
     '    if move[3] > 0',
     '      Sleep(move[3])',
     '    MouseMove(startX + move[1], startY - move[2], 0)',
     '  }',
     '  isPlaying := false',
     '}',
     '',
     `~${hotkey}:: {`,
     '  global isPlaying',
     '  if isPlaying',
     '    return',
     '  isPlaying := true',
     '  PlayPattern(pattern)',
     '}',
     '',
     `~${hotkey} Up:: {`,
     '  global isPlaying',
     '  isPlaying := false',
     '}',
   ];

   return lines.join('\n');
 }, [executionShortcut]);
 
 // Generate Lua code (Logitech format, hold-to-execute, interruptible)
 const generateLua = useCallback((points: MousePoint[]): string => {
   if (points.length === 0) return '-- No points recorded';
   
   const duration = points.length > 0 ? Math.round(points[points.length - 1].timestamp) : 0;
   
   // Build table entries: {dx, dy, delay}
   let lastTimestamp = 0;
   const entries: string[] = [];
   
   points.forEach((point, index) => {
     const delay = index > 0 ? Math.round(point.timestamp - lastTimestamp) : 0;
     lastTimestamp = point.timestamp;
     const x = Math.round(point.x);
     const y = Math.round(point.y);
     entries.push(`{${x},${y},${delay}}`);
   });
   
   // Break into rows of 6 entries for readability
   const entriesPerRow = 6;
   const rows: string[] = [];
   for (let i = 0; i < entries.length; i += entriesPerRow) {
     rows.push('  ' + entries.slice(i, i + entriesPerRow).join(','));
   }
   
   // Determine button number for Lua
   const buttonNum = executionShortcut.type === 'mouse' 
     ? executionShortcut.key 
     : '5'; // Default to mouse 5 if keyboard is selected
   
   const lines = [
     '-- ===================================',
     '-- Mouse Movement Script (Logitech)',
     '-- Generated by Mouse Motion Recorder',
     '-- ===================================',
     '-- Pontos: ' + points.length,
     '-- Duração: ' + (duration / 1000).toFixed(2) + 's',
     '-- Botão: Mouse ' + buttonNum + ' (segurar para executar)',
     '',
     'local pattern = {',
     rows.join(',\n'),
     '}',
     '',
     'local function PlayPattern(p, btn)',
     '  local startX, startY = GetMousePosition()',
     '  for i, m in ipairs(p) do',
     '    if not IsMouseButtonPressed(btn) then return end',
     '    if m[3] > 0 then Sleep(m[3]) end',
     '    MoveMouseTo(startX + m[1], startY - m[2])',
     '  end',
     'end',
     '',
     'function OnEvent(event, arg)',
     `  if event == "MOUSE_BUTTON_PRESSED" and arg == ${buttonNum} then`,
     '    PlayPattern(pattern, arg)',
     '  end',
     'end',
   ];

   return lines.join('\n');
 }, [executionShortcut]);
 
   // Derive all data from current state (THE SINGLE SOURCE OF TRUTH)
   const derivedData = useMemo((): DerivedMacroData | null => {
     if (!recordingData || recordingData.points.length === 0) return null;
     
     // Step 1: Apply space edits
     let points = applySpaceEdits(recordingData.points);
     
     // Step 2: Apply time edits
     points = applyTimeEdits(points);
     
     // Calculate derived values
     const duration = points.length > 0 ? points[points.length - 1].timestamp : 0;
     const pointCount = points.length;
     
     // Calculate average speed (pixels per second)
     let totalDistance = 0;
     for (let i = 1; i < points.length; i++) {
       const dx = points[i].x - points[i - 1].x;
       const dy = points[i].y - points[i - 1].y;
       totalDistance += Math.sqrt(dx * dx + dy * dy);
     }
     const averageSpeed = duration > 0 ? (totalDistance / (duration / 1000)) : 0;
     
     // Generate code
     const codeAHK = generateAHK(points);
     const codeLua = generateLua(points);
     
     return {
       points,
       duration,
       pointCount,
       averageSpeed,
       codeAHK,
       codeLua,
     };
   }, [recordingData, applySpaceEdits, applyTimeEdits, generateAHK, generateLua]);
 
   // Actions
   const updateEditSetting = useCallback(<K extends keyof EditSettings>(
     key: K,
     value: EditSettings[K]
   ) => {
     setEditSettings(prev => ({ ...prev, [key]: value }));
   }, []);
 
   const updateTimeMultiplier = useCallback((multiplier: number) => {
     setTimeSettings(prev => ({
       ...prev,
       timeMultiplier: multiplier,
       adjustedDuration: Math.round(prev.originalDuration / multiplier),
     }));
   }, []);
 
   const setTargetDuration = useCallback((targetMs: number) => {
     if (timeSettings.originalDuration > 0) {
       const multiplier = timeSettings.originalDuration / targetMs;
       updateTimeMultiplier(multiplier);
     }
   }, [timeSettings.originalDuration, updateTimeMultiplier]);
 
   const resetToOriginal = useCallback(() => {
     setEditSettings(DEFAULT_EDIT_SETTINGS);
     setTimeSettings(prev => ({
       ...prev,
       timeMultiplier: 1,
       adjustedDuration: prev.originalDuration,
     }));
     setSegments([]);
     setSelectedSegment(null);
   }, []);
 
   const addSegment = useCallback((startIndex: number, endIndex: number) => {
     setSegments(prev => [...prev, { startIndex, endIndex, timeMultiplier: 1 }]);
   }, []);
 
   const updateSegmentMultiplier = useCallback((index: number, multiplier: number) => {
     setSegments(prev => prev.map((seg, i) => 
       i === index ? { ...seg, timeMultiplier: multiplier } : seg
     ));
   }, []);
 
   const removeSegment = useCallback((index: number) => {
     setSegments(prev => prev.filter((_, i) => i !== index));
     if (selectedSegment === index) setSelectedSegment(null);
   }, [selectedSegment]);
 
  return {
    // State
    editSettings,
    timeSettings,
    segments,
    selectedSegment,
    derivedData,
    executionShortcut,
    
    // Actions
    initializeFromRecording,
    updateEditSetting,
    updateTimeMultiplier,
    setTargetDuration,
    resetToOriginal,
    addSegment,
    updateSegmentMultiplier,
    removeSegment,
    setSelectedSegment,
    setExecutionShortcut,
  };
 }