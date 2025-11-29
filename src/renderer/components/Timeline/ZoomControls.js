import React from 'react';

function ZoomControls({ zoom, duration, onZoomChange }) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom * 1.5, 200));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom / 1.5, 10));
  };

  const handleFit = () => {
    // Calculate zoom to fit entire duration in viewport (approx 800px)
    const fitZoom = Math.min(800 / Math.max(duration, 10), 100);
    onZoomChange(Math.max(fitZoom, 10));
  };

  const handleReset = () => {
    onZoomChange(50); // Default zoom level
  };

  const zoomPercentage = Math.round((zoom / 50) * 100);

  return (
    <div className="zoom-controls">
      <button 
        className="zoom-btn" 
        onClick={handleFit}
        title="Fit to window"
      >
        ⬚
      </button>
      <button 
        className="zoom-btn" 
        onClick={handleZoomOut}
        title="Zoom out"
        disabled={zoom <= 10}
      >
        −
      </button>
      <span className="zoom-level" title="Current zoom level">
        {zoomPercentage}%
      </span>
      <button 
        className="zoom-btn" 
        onClick={handleZoomIn}
        title="Zoom in"
        disabled={zoom >= 200}
      >
        +
      </button>
      <button 
        className="zoom-btn" 
        onClick={handleReset}
        title="Reset zoom"
      >
        ↺
      </button>
    </div>
  );
}

export default ZoomControls;
