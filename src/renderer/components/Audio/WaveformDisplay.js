import React, { useRef, useEffect, useCallback } from 'react';
import { renderWaveform } from '../../modules/audio/Waveform';
import { WAVEFORM_SETTINGS } from '../../modules/audio/audioTypes';

/**
 * WaveformDisplay component - Renders audio waveform on a canvas
 */
function WaveformDisplay({ 
  waveformData,
  width = 300,
  height = WAVEFORM_SETTINGS.minHeight,
  color = WAVEFORM_SETTINGS.waveformColor,
  startTime = 0,
  endTime = null,
  duration = 0,
  playhead = null,
  onClick = null,
}) {
  const canvasRef = useRef(null);
  
  // Render waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData || waveformData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate visible range
    const numPeaks = waveformData.length / 2;
    const startSample = duration > 0 ? Math.floor((startTime / duration) * numPeaks) : 0;
    const endSample = duration > 0 && endTime !== null
      ? Math.ceil((endTime / duration) * numPeaks)
      : numPeaks;
    
    // Render waveform
    renderWaveform(ctx, waveformData, {
      width,
      height,
      color,
      startSample,
      endSample,
    });
    
    // Draw playhead if provided
    if (playhead !== null && duration > 0) {
      const playheadX = ((playhead - startTime) / (endTime - startTime)) * width;
      if (playheadX >= 0 && playheadX <= width) {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
      }
    }
  }, [waveformData, width, height, color, startTime, endTime, duration, playhead]);
  
  // Handle click
  const handleClick = useCallback((e) => {
    if (!onClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / width;
    const time = startTime + progress * ((endTime || duration) - startTime);
    
    onClick(time);
  }, [onClick, width, startTime, endTime, duration]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="waveform-canvas"
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}

export default WaveformDisplay;
