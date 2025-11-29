import React, { useMemo } from 'react';

function TimelineRuler({ duration, zoom, currentTime, onClick }) {
  const markers = useMemo(() => {
    const result = [];
    // Calculate interval based on zoom level
    let interval = 1; // seconds
    
    if (zoom < 20) {
      interval = 10;
    } else if (zoom < 50) {
      interval = 5;
    } else if (zoom < 100) {
      interval = 2;
    }
    
    const totalDuration = Math.max(duration, 30); // minimum 30 seconds shown
    
    for (let time = 0; time <= totalDuration; time += interval) {
      result.push({
        time,
        position: time * zoom,
        label: formatTime(time),
        isMajor: time % (interval * 5) === 0
      });
    }
    
    return result;
  }, [duration, zoom]);

  const handleRulerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = clickX / zoom;
    onClick(Math.max(0, Math.min(clickTime, duration)));
  };

  const totalWidth = Math.max(duration, 30) * zoom;
  const playheadPosition = currentTime * zoom;

  return (
    <div className="timeline-ruler" onClick={handleRulerClick}>
      <div className="ruler-track" style={{ width: `${totalWidth}px` }}>
        {markers.map((marker, index) => (
          <div
            key={index}
            className={`ruler-marker ${marker.isMajor ? 'major' : 'minor'}`}
            style={{ left: `${marker.position}px` }}
          >
            {marker.isMajor && (
              <span className="ruler-label">{marker.label}</span>
            )}
          </div>
        ))}
        <div 
          className="playhead" 
          style={{ left: `${playheadPosition}px` }}
        >
          <div className="playhead-marker">▼</div>
          <div className="playhead-line"></div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default TimelineRuler;
