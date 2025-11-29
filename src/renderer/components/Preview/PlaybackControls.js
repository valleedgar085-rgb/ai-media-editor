import React from 'react';

function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onPlayPause,
  onSeek,
  onFrameStep,
  onPlaybackRateChange
}) {
  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e) => {
    onSeek(parseFloat(e.target.value));
  };

  const handleRateChange = (e) => {
    onPlaybackRateChange(parseFloat(e.target.value));
  };

  const playbackRates = [0.25, 0.5, 1, 1.5, 2, 4];

  return (
    <div className="playback-controls">
      <div className="controls-row main-controls">
        <button
          className="control-btn frame-step"
          onClick={() => onFrameStep(-1)}
          title="Previous frame"
          disabled={currentTime <= 0}
        >
          ⏮
        </button>
        
        <button
          className="control-btn play-pause"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button
          className="control-btn frame-step"
          onClick={() => onFrameStep(1)}
          title="Next frame"
          disabled={currentTime >= duration}
        >
          ⏭
        </button>
      </div>

      <div className="controls-row seek-row">
        <span className="time-display">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="seek-slider"
          min="0"
          max={duration || 1}
          step="0.01"
          value={currentTime}
          onChange={handleSeekChange}
        />
        <span className="time-display">{formatTime(duration)}</span>
      </div>

      <div className="controls-row rate-row">
        <label className="rate-label">Speed:</label>
        <select
          className="rate-select"
          value={playbackRate}
          onChange={handleRateChange}
        >
          {playbackRates.map(rate => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default PlaybackControls;
