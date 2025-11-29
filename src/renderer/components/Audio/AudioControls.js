import React, { useState, useCallback } from 'react';
import useEditorStore from '../../store/useEditorStore';

/**
 * AudioControls component - Controls for an audio clip (volume, fade, mute, solo)
 */
function AudioControls({ trackId, item }) {
  const { 
    updateAudioSettings, 
    toggleMute, 
    toggleSolo,
  } = useEditorStore();
  
  const [expanded, setExpanded] = useState(false);
  
  const volume = item.volume ?? 1.0;
  const muted = item.muted ?? false;
  const solo = item.solo ?? false;
  const fadeIn = item.fadeIn || { enabled: false, duration: 0.5 };
  const fadeOut = item.fadeOut || { enabled: false, duration: 0.5 };
  
  const handleVolumeChange = useCallback((e) => {
    updateAudioSettings(trackId, item.id, { volume: parseFloat(e.target.value) });
  }, [trackId, item.id, updateAudioSettings]);
  
  const handleFadeInToggle = useCallback(() => {
    updateAudioSettings(trackId, item.id, {
      fadeIn: { ...fadeIn, enabled: !fadeIn.enabled },
    });
  }, [trackId, item.id, fadeIn, updateAudioSettings]);
  
  const handleFadeInDuration = useCallback((e) => {
    updateAudioSettings(trackId, item.id, {
      fadeIn: { ...fadeIn, duration: parseFloat(e.target.value) },
    });
  }, [trackId, item.id, fadeIn, updateAudioSettings]);
  
  const handleFadeOutToggle = useCallback(() => {
    updateAudioSettings(trackId, item.id, {
      fadeOut: { ...fadeOut, enabled: !fadeOut.enabled },
    });
  }, [trackId, item.id, fadeOut, updateAudioSettings]);
  
  const handleFadeOutDuration = useCallback((e) => {
    updateAudioSettings(trackId, item.id, {
      fadeOut: { ...fadeOut, duration: parseFloat(e.target.value) },
    });
  }, [trackId, item.id, fadeOut, updateAudioSettings]);
  
  return (
    <div className="audio-controls">
      <div className="audio-controls-header">
        <span className="audio-name">{item.name}</span>
        <div className="audio-buttons">
          <button 
            className={`audio-btn mute-btn ${muted ? 'active' : ''}`}
            onClick={() => toggleMute(trackId, item.id)}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button 
            className={`audio-btn solo-btn ${solo ? 'active' : ''}`}
            onClick={() => toggleSolo(trackId, item.id)}
            title={solo ? 'Unsolo' : 'Solo'}
          >
            S
          </button>
          <button 
            className="audio-btn expand-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
      
      {/* Volume slider */}
      <div className="audio-volume">
        <label>Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span className="volume-value">{Math.round(volume * 100)}%</span>
      </div>
      
      {/* Expanded controls */}
      {expanded && (
        <div className="audio-controls-expanded">
          {/* Fade In */}
          <div className="fade-control">
            <label>
              <input
                type="checkbox"
                checked={fadeIn.enabled}
                onChange={handleFadeInToggle}
              />
              Fade In
            </label>
            {fadeIn.enabled && (
              <div className="fade-duration">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={fadeIn.duration}
                  onChange={handleFadeInDuration}
                />
                <span>{fadeIn.duration.toFixed(1)}s</span>
              </div>
            )}
          </div>
          
          {/* Fade Out */}
          <div className="fade-control">
            <label>
              <input
                type="checkbox"
                checked={fadeOut.enabled}
                onChange={handleFadeOutToggle}
              />
              Fade Out
            </label>
            {fadeOut.enabled && (
              <div className="fade-duration">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={fadeOut.duration}
                  onChange={handleFadeOutDuration}
                />
                <span>{fadeOut.duration.toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioControls;
