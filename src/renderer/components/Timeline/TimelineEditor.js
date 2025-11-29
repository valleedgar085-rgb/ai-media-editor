import React, { useRef, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Track from './Track';
import TimelineRuler from './TimelineRuler';
import ZoomControls from './ZoomControls';

// Auto-scroll thresholds for playhead visibility
const SCROLL_TRIGGER_THRESHOLD = 0.8; // Trigger scroll when playhead is past 80% of visible area
const SCROLL_OFFSET_RATIO = 0.2; // Position playhead at 20% from left after scroll

function TimelineEditor({
  tracks,
  zoom,
  currentTime,
  duration,
  isPlaying,
  selectedItemId,
  onSelectItem,
  onRemoveItem,
  onReorderItems,
  onZoomChange,
  onTimeChange,
  onFileDrop
}) {
  const scrollContainerRef = useRef(null);

  // Auto-scroll to keep playhead visible during playback
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const playheadPosition = currentTime * zoom;
      const containerWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;
      
      // Keep playhead in the center-right portion of visible area
      if (playheadPosition > scrollLeft + containerWidth * SCROLL_TRIGGER_THRESHOLD) {
        container.scrollLeft = playheadPosition - containerWidth * SCROLL_OFFSET_RATIO;
      } else if (playheadPosition < scrollLeft) {
        container.scrollLeft = playheadPosition - containerWidth * SCROLL_OFFSET_RATIO;
      }
    }
  }, [currentTime, zoom, isPlaying]);

  const handleTimelineClick = useCallback((time) => {
    onTimeChange(time);
  }, [onTimeChange]);

  const formatCurrentTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Separate video/image tracks from audio tracks
  const videoTracks = tracks.filter(t => t.type === 'video');
  const audioTracks = tracks.filter(t => t.type === 'audio');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="timeline-editor">
        <div className="timeline-toolbar">
          <div className="timeline-info">
            <span className="current-time-display">
              {formatCurrentTime(currentTime)}
            </span>
            <span className="duration-display">
              / {formatCurrentTime(duration)}
            </span>
          </div>
          <ZoomControls
            zoom={zoom}
            duration={duration}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="timeline-scroll-container" ref={scrollContainerRef}>
          <TimelineRuler
            duration={duration}
            zoom={zoom}
            currentTime={currentTime}
            onClick={handleTimelineClick}
          />
          
          <div className="tracks-container">
            {videoTracks.map(track => (
              <Track
                key={track.id}
                track={track}
                zoom={zoom}
                selectedItemId={selectedItemId}
                onSelectItem={onSelectItem}
                onRemoveItem={onRemoveItem}
                onReorderItems={onReorderItems}
                onFileDrop={onFileDrop}
              />
            ))}
            
            <div className="track-separator">
              <span>Audio</span>
            </div>
            
            {audioTracks.map(track => (
              <Track
                key={track.id}
                track={track}
                zoom={zoom}
                selectedItemId={selectedItemId}
                onSelectItem={onSelectItem}
                onRemoveItem={onRemoveItem}
                onReorderItems={onReorderItems}
                onFileDrop={onFileDrop}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default TimelineEditor;
