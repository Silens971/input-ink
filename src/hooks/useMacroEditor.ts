 import { useState, useCallback, useMemo } from 'react';
 import { MousePoint, RecordingData, EditSettings, TimeSettings, MacroState, DerivedMacroData, SegmentSelection } from '@/types/recording';
 
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
 
 export function useMacroEditor(recordingData: RecordingData | null) {
   const [editSettings, setEditSettings] = useState<EditSettings>(DEFAULT_EDIT_SETTINGS);
   const [timeSettings, setTimeSettings] = useState<TimeSettings>(DEFAULT_TIME_SETTINGS);
   const [segments, setSegments] = useState<SegmentSelection[]>([]);
   const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
 
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
 
  // Generate AutoHotkey code (compacted format)
  const generateAHK = useCallback((points: MousePoint[]): string => {
    if (points.length === 0) return '; No points recorded';
    
    // Build compacted data string: "x,y,delay|x,y,delay|..."
    let lastTimestamp = 0;
    const dataPoints: string[] = [];
    
    points.forEach((point, index) => {
      const delay = index > 0 ? Math.round(point.timestamp - lastTimestamp) : 0;
      lastTimestamp = point.timestamp;
      const x = Math.round(point.x);
      const y = Math.round(point.y);
      dataPoints.push(`${x},${y},${delay}`);
    });
    
    // Break coords into chunks of ~80 chars for readability
    const fullString = dataPoints.join('|');
    const chunkSize = 60;
    const chunks: string[] = [];
    for (let i = 0; i < fullString.length; i += chunkSize) {
      chunks.push(fullString.slice(i, i + chunkSize));
    }
    const coordsLines = chunks.length > 1 
      ? 'coords := ""\n' + chunks.map(c => `coords .= "${c}"`).join('\n')
      : `coords := "${fullString}"`;
    
    const duration = points.length > 0 ? Math.round(points[points.length - 1].timestamp) : 0;
    
    const lines = [
      '; ===================================',
      '; Mouse Movement Script (Compacted)',
      '; Generated by Mouse Motion Recorder',
      '; ===================================',
      '; Tempo: ' + (timeSettings.timeMultiplier !== 1 ? `${timeSettings.timeMultiplier.toFixed(2)}x` : 'Original'),
      '; Pontos: ' + points.length,
      '; Duração: ' + (duration / 1000).toFixed(2) + 's',
      '',
      '#SingleInstance Force',
      '#NoEnv',
      'SetBatchLines, -1',
      'CoordMode, Mouse, Screen',
      '',
      coordsLines,
      '',
      'F5::',
      '  MouseGetPos, startX, startY',
      '  Loop, Parse, coords, |',
      '  {',
      '    parts := StrSplit(A_LoopField, ",")',
      '    x := parts[1]',
      '    y := parts[2]',
      '    delay := parts[3]',
      '    if (delay > 0)',
      '      Sleep, %delay%',
      '    MouseMove, % startX + x, % startY - y, 0',
      '  }',
      'Return',
      '',
      'Escape::ExitApp',
    ];

    return lines.join('\n');
  }, [timeSettings.timeMultiplier]);
 
  // Generate Lua code (Logitech format, compacted)
  const generateLua = useCallback((points: MousePoint[]): string => {
    if (points.length === 0) return '-- No points recorded';
    
    const duration = points.length > 0 ? Math.round(points[points.length - 1].timestamp) : 0;
    
    // Build compacted data table with line breaks for readability
    let lastTimestamp = 0;
    const moveEntries: string[] = [];
    
    points.forEach((point, index) => {
      const delay = index > 0 ? Math.round(point.timestamp - lastTimestamp) : 0;
      lastTimestamp = point.timestamp;
      const x = Math.round(point.x);
      const y = Math.round(point.y);
      moveEntries.push(`{${x},${y},${delay}}`);
    });
    
    // Break into rows of 8 entries for readability
    const entriesPerRow = 8;
    const rows: string[] = [];
    for (let i = 0; i < moveEntries.length; i += entriesPerRow) {
      rows.push('  ' + moveEntries.slice(i, i + entriesPerRow).join(','));
    }
    
    const lines = [
      '-- ===================================',
      '-- Mouse Movement Script (Logitech)',
      '-- Generated by Mouse Motion Recorder',
      '-- ===================================',
      '-- Tempo: ' + (timeSettings.timeMultiplier !== 1 ? `${timeSettings.timeMultiplier.toFixed(2)}x` : 'Original'),
      '-- Pontos: ' + points.length,
      '-- Duração: ' + (duration / 1000).toFixed(2) + 's',
      '',
      'local moves = {',
      rows.join(',\n'),
      '}',
      '',
      'function OnEvent(event, arg)',
      '  if event == "MOUSE_BUTTON_PRESSED" and arg == 5 then',
      '    local startX, startY = GetMousePosition()',
      '    for i, v in ipairs(moves) do',
      '      if v[3] > 0 then Sleep(v[3]) end',
      '      MoveMouseTo(startX + v[1], startY - v[2])',
      '    end',
      '  end',
      'end',
    ];

    return lines.join('\n');
  }, [timeSettings.timeMultiplier]);
 
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
   };
 }