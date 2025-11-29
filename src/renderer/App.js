import React, { useState, useCallback } from 'react';
import DragDropZone from './components/DragDropZone';
import Preview from './components/Preview';
import Timeline from './components/Timeline';

function App() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFilesAdded = useCallback((newFiles) => {
    const fileObjects = newFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name || file.path?.split(/[/\\]/).pop() || 'Unknown',
      path: file.path || URL.createObjectURL(file),
      type: file.type || (file.path?.match(/\.(mp4|webm|mkv|avi|mov)$/i) ? 'video' : 'image'),
      duration: 0
    }));
    
    setMediaFiles(prev => [...prev, ...fileObjects]);
    if (!selectedFile && fileObjects.length > 0) {
      setSelectedFile(fileObjects[0]);
    }
  }, [selectedFile]);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
  }, []);

  const handleRemoveFile = useCallback((fileId) => {
    setMediaFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  }, [selectedFile]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI Media Editor</h1>
      </header>
      
      <main className="app-main">
        <div className="left-panel">
          <DragDropZone onFilesAdded={handleFilesAdded} />
        </div>
        
        <div className="center-panel">
          <Preview file={selectedFile} />
        </div>
      </main>
      
      <footer className="app-footer">
        <Timeline 
          files={mediaFiles} 
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
        />
      </footer>
    </div>
  );
}

export default App;
