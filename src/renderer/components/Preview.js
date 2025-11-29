import React from 'react';

function Preview({ file }) {
  if (!file) {
    return (
      <div className="preview-container empty">
        <div className="preview-placeholder">
          <div className="preview-icon">🎬</div>
          <p>Select a file to preview</p>
        </div>
      </div>
    );
  }

  const isVideo = file.type === 'video' || 
    file.path?.match(/\.(mp4|webm|mkv|avi|mov)$/i) ||
    file.name?.match(/\.(mp4|webm|mkv|avi|mov)$/i);

  return (
    <div className="preview-container">
      {isVideo ? (
        <video 
          className="preview-media"
          src={file.path}
          controls
          autoPlay={false}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <img 
          className="preview-media"
          src={file.path}
          alt={file.name}
        />
      )}
      <div className="preview-info">
        <span className="preview-filename">{file.name}</span>
      </div>
    </div>
  );
}

export default Preview;
