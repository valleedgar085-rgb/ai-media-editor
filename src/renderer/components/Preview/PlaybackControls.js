import React, { useCallback } from 'react';
import useEditorStore from '../../store/useEditorStore';

/**
 * Format time in MM:SS format
 */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * PlaybackControls component - controls for the preview player
 */
function PlaybackControls() {
  const {
    playhead,
    duration,
    isPlaying,
    playbackRate,
    togglePlayback,
    stepForward,
    stepBackward,
    goToStart,
    goToEnd,
    setPlayhead,
    setPlaybackRate,
  } = useEditorStore();
  
  const handleSeek = useCallback((e) => {
    const newTime = parseFloat(e.target.value);
    setPlayhead(newTime);
  }, [setPlayhead]);
  
  const handleRateChange = useCallback((rate) => {
    setPlaybackRate(rate);
  }, [setPlaybackRate]);
  
  const playbackRates = [0.25, 0.5, 1, 1.5, 2, 4];
  
  return (
    <div className="playback-controls-panel">
      {/* Progress bar */}
      <div className="progress-bar-container">
        <span className="time-label">{formatTime(playhead)}</span>
        <input
          type="range"
          className="progress-bar"
          min={0}
          max={duration || 1}
          step={0.01}
          value={playhead}
          onChange={handleSeek}
        />
        <span className="time-label">{formatTime(duration)}</span>
      </div>
      
      {/* Main controls */}
      <div className="main-controls">
        <button
          className="control-btn small"
          onClick={goToStart}
          title="Go to start"
        >
          ⏮
        </button>
        
        <button
          className="control-btn small"
          onClick={stepBackward}
          title="Previous frame"
        >
          ◀◀
        </button>
        
        <button
          className="control-btn play-btn large"
          onClick={togglePlayback}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button
          className="control-btn small"
          onClick={stepForward}
          title="Next frame"
        >
          ▶▶
        </button>
        
        <button
          className="control-btn small"
          onClick={goToEnd}
          title="Go to end"
        >
          ⏭
        </button>
      </div>
      
      {/* Playback rate selector */}
      <div className="rate-controls">
        <span className="rate-label">Speed:</span>
        <div className="rate-buttons">
          {playbackRates.map((rate) => (
            <button
              key={rate}
              className={`rate-btn ${playbackRate === rate ? 'active' : ''}`}
              onClick={() => handleRateChange(rate)}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlaybackControls;
