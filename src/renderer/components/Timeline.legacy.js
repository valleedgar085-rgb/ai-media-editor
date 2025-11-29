import React from 'react';

function Timeline({ files, selectedFile, onFileSelect, onRemoveFile }) {
  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <span className="timeline-count">{files.length} item(s)</span>
      </div>
      
      <div className="timeline-track">
        {files.length === 0 ? (
          <div className="timeline-empty">
            <p>No media files added. Drag & drop or browse to add files.</p>
          </div>
        ) : (
          <div className="timeline-items">
            {files.map((file) => (
              <div 
                key={file.id}
                className={`timeline-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
                onClick={() => onFileSelect(file)}
              >
                <div className="timeline-item-preview">
                  {file.type === 'video' || file.name?.match(/\.(mp4|webm|mkv|avi|mov)$/i) ? (
                    <span className="timeline-item-icon">🎥</span>
                  ) : (
                    <span className="timeline-item-icon">🖼️</span>
                  )}
                </div>
                <div className="timeline-item-info">
                  <span className="timeline-item-name" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button 
                  className="timeline-item-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                  title="Remove from timeline"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="timeline-controls">
        <div className="timeline-scrubber">
          <div className="timeline-ruler">
            {/* Timeline ruler marks - placeholder for Phase 2 */}
            <span className="ruler-mark">0:00</span>
            <span className="ruler-mark">0:30</span>
            <span className="ruler-mark">1:00</span>
            <span className="ruler-mark">1:30</span>
            <span className="ruler-mark">2:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
