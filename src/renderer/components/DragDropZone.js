import React, { useState, useCallback } from 'react';

function DragDropZone({ onFilesAdded }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'bmp'];
      return allowedExtensions.includes(ext);
    });

    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleBrowseClick = useCallback(async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFileDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        const files = result.filePaths.map(path => ({ path }));
        onFilesAdded(files);
      }
    } else {
      // Fallback for browser testing
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'video/*,image/*';
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          onFilesAdded(files);
        }
      };
      input.click();
    }
  }, [onFilesAdded]);

  return (
    <div 
      className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="drag-drop-content">
        <div className="drag-drop-icon">📁</div>
        <p className="drag-drop-text">
          Drag & drop media files here
        </p>
        <p className="drag-drop-subtext">
          or
        </p>
        <button className="browse-button" onClick={handleBrowseClick}>
          Browse Files
        </button>
        <p className="supported-formats">
          Supported: MP4, WebM, MKV, AVI, MOV, JPG, PNG, GIF
        </p>
      </div>
    </div>
  );
}

export default DragDropZone;
