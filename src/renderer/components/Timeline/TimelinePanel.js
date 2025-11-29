import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TimelineTrack from './TimelineTrack';
import useEditorStore from '../../store/useEditorStore';

/**
 * Format time in MM:SS.ms format
 */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

/**
 * TimelinePanel component - main timeline editor with tracks, zoom, and playhead
 */
function TimelinePanel() {
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Store state and actions
  const {
    tracks,
    selectedItemId,
    zoom,
    playhead,
    duration,
    isPlaying,
    setZoom,
    zoomIn,
    zoomOut,
    fitToView,
    setPlayhead,
    selectItem,
    removeMediaItem,
    moveMediaItem,
    reorderItems,
    moveItemToTrack,
    play,
    pause,
    togglePlayback,
    stepForward,
    stepBackward,
    goToStart,
    goToEnd,
  } = useEditorStore();
  
  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);
  
  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);
  
  const handleFitToView = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      fitToView(scrollContainer.clientWidth - 100);
    }
  }, [fitToView]);
  
  // Handle playhead click/drag on ruler
  const handleRulerClick = useCallback((e) => {
    const ruler = e.currentTarget;
    const rect = ruler.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, x / zoom);
    setPlayhead(time);
  }, [zoom, setPlayhead]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            goToStart();
          } else {
            stepBackward();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            goToEnd();
          } else {
            stepForward();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedItemId) {
            e.preventDefault();
            // Find which track contains the selected item
            for (const track of tracks) {
              const item = track.items.find(i => i.id === selectedItemId);
              if (item) {
                removeMediaItem(track.id, selectedItemId);
                break;
              }
            }
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, stepForward, stepBackward, goToStart, goToEnd, zoomIn, zoomOut, selectedItemId, tracks, removeMediaItem]);
  
  // Calculate timeline width
  const timelineWidth = Math.max(1000, duration * zoom + 200);
  
  // Generate ruler marks
  const generateRulerMarks = useCallback(() => {
    const marks = [];
    const interval = zoom > 50 ? 1 : zoom > 20 ? 5 : zoom > 5 ? 10 : 30;
    const maxTime = Math.max(duration + 10, timelineWidth / zoom);
    
    for (let time = 0; time <= maxTime; time += interval) {
      marks.push({
        time,
        left: time * zoom,
        isMajor: time % (interval * 5) === 0,
      });
    }
    
    return marks;
  }, [zoom, duration, timelineWidth]);
  
  const rulerMarks = generateRulerMarks();
  
  return (
    <div className="timeline-panel" ref={containerRef}>
      {/* Timeline header with controls */}
      <div className="timeline-header-v2">
        <div className="timeline-title">
          <h3>Timeline</h3>
          <span className="timeline-info">
            {tracks.reduce((sum, t) => sum + t.items.length, 0)} items | {formatTime(duration)}
          </span>
        </div>
        
        {/* Playback controls */}
        <div className="playback-controls">
          <button className="control-btn" onClick={goToStart} title="Go to start (Shift+←)">
            ⏮
          </button>
          <button className="control-btn" onClick={stepBackward} title="Step backward (←)">
            ◀◀
          </button>
          <button className="control-btn play-btn" onClick={togglePlayback} title="Play/Pause (Space)">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="control-btn" onClick={stepForward} title="Step forward (→)">
            ▶▶
          </button>
          <button className="control-btn" onClick={goToEnd} title="Go to end (Shift+→)">
            ⏭
          </button>
        </div>
        
        {/* Current time display */}
        <div className="time-display">
          <span className="current-time">{formatTime(playhead)}</span>
          <span className="time-separator">/</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>
        
        {/* Zoom controls */}
        <div className="zoom-controls">
          <button className="control-btn" onClick={handleZoomOut} title="Zoom out (-)">
            🔍−
          </button>
          <span className="zoom-level">{Math.round(zoom * 10)}%</span>
          <button className="control-btn" onClick={handleZoomIn} title="Zoom in (+)">
            🔍+
          </button>
          <button className="control-btn" onClick={handleFitToView} title="Fit to view">
            ⬚
          </button>
        </div>
      </div>
      
      {/* Timeline content */}
      <div className="timeline-content" ref={scrollContainerRef}>
        {/* Time ruler */}
        <div className="time-ruler" onClick={handleRulerClick} style={{ width: `${timelineWidth}px` }}>
          {rulerMarks.map((mark, index) => (
            <div
              key={index}
              className={`ruler-mark ${mark.isMajor ? 'major' : 'minor'}`}
              style={{ left: `${mark.left}px` }}
            >
              {mark.isMajor && (
                <span className="ruler-label">{formatTime(mark.time)}</span>
              )}
            </div>
          ))}
          
          {/* Playhead on ruler */}
          <div
            className="playhead-marker"
            style={{ left: `${playhead * zoom}px` }}
          >
            <div className="playhead-head" />
          </div>
        </div>
        
        {/* Tracks container */}
        <DndProvider backend={HTML5Backend}>
          <div className="tracks-container">
            {tracks.map((track) => (
              <TimelineTrack
                key={track.id}
                track={track}
                zoom={zoom}
                selectedItemId={selectedItemId}
                duration={duration}
                onSelectItem={selectItem}
                onRemoveItem={removeMediaItem}
                onMoveItem={moveMediaItem}
                onReorderItems={reorderItems}
                onMoveItemToTrack={moveItemToTrack}
              />
            ))}
            
            {/* Playhead line across tracks */}
            <div
              className="playhead-line"
              style={{ left: `${100 + playhead * zoom}px` }}
            />
          </div>
        </DndProvider>
      </div>
      
      {/* Empty state */}
      {tracks.every(t => t.items.length === 0) && (
        <div className="timeline-empty-v2">
          <p>No media files added. Drag & drop or browse to add files.</p>
          <p className="timeline-hint">
            Use the upload panel on the left to add media to the timeline.
          </p>
        </div>
      )}
    </div>
  );
}

export default TimelinePanel;
