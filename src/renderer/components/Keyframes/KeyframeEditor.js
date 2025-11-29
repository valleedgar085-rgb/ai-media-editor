import React, { useState, useCallback, useMemo } from 'react';
import useEditorStore from '../../store/useEditorStore';
import { KEYFRAME_PROPERTY, EASING_PRESET, EASING_CONFIG, PROPERTY_RANGE } from '../../modules/keyframes/keyframeTypes';

/**
 * KeyframeEditor component - UI for editing keyframes on clips
 */
function KeyframeEditor({ trackId, item, onClose }) {
  const { playhead, addVolumeKeyframe, removeVolumeKeyframe } = useEditorStore();
  
  const [selectedProperty, setSelectedProperty] = useState(KEYFRAME_PROPERTY.OPACITY);
  const [selectedEasing, setSelectedEasing] = useState(EASING_PRESET.LINEAR);
  
  // Get keyframes for the item (for now, just volume keyframes for audio)
  const keyframes = item.volumeKeyframes || [];
  
  // Get property range
  const range = PROPERTY_RANGE[selectedProperty] || { min: 0, max: 1, default: 0 };
  
  // Calculate time relative to clip start
  const relativePlayhead = useMemo(() => {
    return Math.max(0, Math.min(item.duration, playhead - item.startTime));
  }, [playhead, item.startTime, item.duration]);
  
  const isWithinClip = playhead >= item.startTime && playhead <= item.startTime + item.duration;
  
  // Add keyframe at playhead
  const handleAddKeyframe = useCallback(() => {
    if (!isWithinClip) return;
    
    const value = selectedProperty === KEYFRAME_PROPERTY.VOLUME ? (item.volume ?? 1.0) : range.default;
    addVolumeKeyframe(trackId, item.id, relativePlayhead, value, selectedEasing);
  }, [trackId, item.id, relativePlayhead, selectedProperty, selectedEasing, range.default, isWithinClip, addVolumeKeyframe, item.volume]);
  
  // Remove keyframe
  const handleRemoveKeyframe = useCallback((keyframeId) => {
    removeVolumeKeyframe(trackId, item.id, keyframeId);
  }, [trackId, item.id, removeVolumeKeyframe]);
  
  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };
  
  return (
    <div className="keyframe-editor">
      <div className="keyframe-editor-header">
        <h3>Keyframe Editor</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="keyframe-editor-content">
        {/* Clip info */}
        <div className="keyframe-clip-info">
          <span className="clip-name">{item.name}</span>
          <span className="clip-duration">Duration: {item.duration.toFixed(2)}s</span>
        </div>
        
        {/* Property selector */}
        <div className="keyframe-property-selector">
          <label>Property:</label>
          <select 
            value={selectedProperty} 
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            <option value={KEYFRAME_PROPERTY.OPACITY}>Opacity</option>
            <option value={KEYFRAME_PROPERTY.VOLUME}>Volume</option>
            <option value={KEYFRAME_PROPERTY.BRIGHTNESS}>Brightness</option>
            <option value={KEYFRAME_PROPERTY.CONTRAST}>Contrast</option>
            <option value={KEYFRAME_PROPERTY.SATURATION}>Saturation</option>
            <option value={KEYFRAME_PROPERTY.SCALE_X}>Scale X</option>
            <option value={KEYFRAME_PROPERTY.SCALE_Y}>Scale Y</option>
            <option value={KEYFRAME_PROPERTY.ROTATION}>Rotation</option>
          </select>
        </div>
        
        {/* Easing selector */}
        <div className="keyframe-easing-selector">
          <label>Easing:</label>
          <select 
            value={selectedEasing} 
            onChange={(e) => setSelectedEasing(e.target.value)}
          >
            {Object.entries(EASING_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
        </div>
        
        {/* Playhead position */}
        <div className="keyframe-playhead-info">
          <span>Playhead: {formatTime(relativePlayhead)}</span>
          {!isWithinClip && (
            <span className="warning">Move playhead into clip</span>
          )}
        </div>
        
        {/* Add keyframe button */}
        <button 
          className="btn btn-primary add-keyframe-btn"
          onClick={handleAddKeyframe}
          disabled={!isWithinClip}
        >
          Add Keyframe at Playhead
        </button>
        
        {/* Keyframe list */}
        <div className="keyframe-list">
          <h4>Keyframes ({keyframes.length})</h4>
          {keyframes.length === 0 ? (
            <p className="no-keyframes">No keyframes added yet</p>
          ) : (
            <ul>
              {keyframes.map((kf) => (
                <li key={kf.id} className="keyframe-item">
                  <span className="kf-time">{formatTime(kf.time)}</span>
                  <span className="kf-value">{(kf.value * 100).toFixed(0)}%</span>
                  <span className="kf-easing">{kf.easing}</span>
                  <button 
                    className="kf-remove-btn"
                    onClick={() => handleRemoveKeyframe(kf.id)}
                    title="Remove keyframe"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Visual keyframe track */}
        <div className="keyframe-visual-track">
          <div className="kf-track-bar">
            {keyframes.map((kf) => (
              <div
                key={kf.id}
                className="kf-marker"
                style={{ left: `${(kf.time / item.duration) * 100}%` }}
                title={`${formatTime(kf.time)}: ${(kf.value * 100).toFixed(0)}%`}
              />
            ))}
            {isWithinClip && (
              <div
                className="kf-playhead-marker"
                style={{ left: `${(relativePlayhead / item.duration) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyframeEditor;
