import React, { useCallback, useEffect } from 'react';
import DragDropZone from './components/DragDropZone';
import { PreviewPlayer } from './components/Preview/index';
import { TimelinePanel } from './components/Timeline/index';
import useEditorStore from './store/useEditorStore';
import { generateThumbnail, getVideoDuration, isVideoFile, isAudioFile } from './utils/thumbnailUtils';

function App() {
  const { addMediaItem, updateItemThumbnail, updateItemDuration, tracks } = useEditorStore();

  const handleFilesAdded = useCallback(async (newFiles) => {
    for (const file of newFiles) {
      const name = file.name || file.path?.split(/[/\\]/).pop() || 'Unknown';
      const path = file.path || URL.createObjectURL(file);
      
      // Determine file type
      let type = 'image';
      if (isVideoFile(path) || isVideoFile(name)) {
        type = 'video';
      } else if (isAudioFile(path) || isAudioFile(name)) {
        type = 'audio';
      }
      
      // Determine which track to add to
      const trackId = type === 'audio' ? 'audio-track' : 'video-track';
      
      // Get video duration if applicable
      let duration = 5; // default for images
      if (type === 'video') {
        try {
          duration = await getVideoDuration(path);
        } catch (e) {
          console.warn('Could not get video duration:', e);
        }
      }
      
      // Add item to store
      const itemId = addMediaItem(trackId, {
        name,
        path,
        type,
        duration,
      });
      
      // Generate thumbnail asynchronously
      if (type !== 'audio') {
        generateThumbnail(path, type).then(thumbnail => {
          if (thumbnail) {
            updateItemThumbnail(trackId, itemId, thumbnail);
          }
        }).catch(e => {
          console.warn('Thumbnail generation failed:', e);
        });
      }
    }
  }, [addMediaItem, updateItemThumbnail, updateItemDuration]);

  // Keyboard shortcut hints
  useEffect(() => {
    console.log('AI Media Editor - Phase 2');
    console.log('Keyboard shortcuts:');
    console.log('  Space: Play/Pause');
    console.log('  Left/Right Arrow: Step backward/forward');
    console.log('  Shift+Left/Right: Go to start/end');
    console.log('  +/-: Zoom in/out');
    console.log('  Delete/Backspace: Remove selected item');
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI Media Editor</h1>
        <span className="app-version">Phase 2</span>
      </header>
      
      <main className="app-main">
        <div className="left-panel">
          <DragDropZone onFilesAdded={handleFilesAdded} />
        </div>
        
        <div className="center-panel">
          <PreviewPlayer />
        </div>
      </main>
      
      <footer className="app-footer">
        <TimelinePanel />
      </footer>
    </div>
  );
}

export default App;
