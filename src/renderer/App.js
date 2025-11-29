import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DragDropZone from './components/DragDropZone';
import { TimelineEditor } from './components/Timeline';
import { PreviewPlayer } from './components/Preview';
import { generateThumbnail, createPlaceholderThumbnail } from './store';

// Initial state for tracks
const initialTracks = [
  { id: 'video-track', type: 'video', name: 'Video Track', items: [] },
  { id: 'audio-track', type: 'audio', name: 'Audio Track', items: [] }
];

// Detect media type from file
const detectMediaType = (file) => {
  const name = file.name || file.path || '';
  if (name.match(/\.(mp4|webm|mkv|avi|mov)$/i)) return 'video';
  if (name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) return 'audio';
  return 'image';
};

function App() {
  // Timeline state
  const [tracks, setTracks] = useState(initialTracks);
  const [zoom, setZoom] = useState(50); // pixels per second
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100
  });

  // Calculate total duration when tracks change
  useEffect(() => {
    const maxDuration = tracks.reduce((max, track) => {
      const trackDuration = track.items.reduce((sum, item) => 
        Math.max(sum, item.startTime + item.duration), 0
      );
      return Math.max(max, trackDuration);
    }, 0);
    setDuration(maxDuration);
  }, [tracks]);

  // Recalculate start times for a track
  const recalculateStartTimes = useCallback((trackItems) => {
    let currentStartTime = 0;
    return trackItems.map(item => {
      const newItem = { ...item, startTime: currentStartTime };
      currentStartTime += item.duration;
      return newItem;
    });
  }, []);

  // Handle file upload and thumbnail generation
  const handleFilesAdded = useCallback(async (newFiles) => {
    for (const file of newFiles) {
      const mediaType = detectMediaType(file);
      const trackId = mediaType === 'audio' ? 'audio-track' : 'video-track';
      const path = file.path || (file instanceof File ? URL.createObjectURL(file) : '');
      
      // Create placeholder item first
      const newItem = {
        id: uuidv4(),
        name: file.name || file.path?.split(/[/\\]/).pop() || 'Unknown',
        path,
        type: mediaType,
        duration: mediaType === 'image' ? 5 : 10, // default durations
        startTime: 0,
        thumbnail: createPlaceholderThumbnail(mediaType)
      };

      // Add to tracks
      setTracks(prev => prev.map(track => {
        if (track.id === trackId) {
          const newItems = [...track.items, newItem];
          return { ...track, items: recalculateStartTimes(newItems) };
        }
        return track;
      }));

      // Generate thumbnail asynchronously
      try {
        const result = await generateThumbnail({ ...file, path, type: mediaType });
        
        // Update item with real thumbnail and duration
        setTracks(prev => prev.map(track => {
          if (track.id === trackId) {
            const newItems = track.items.map(item => {
              if (item.id === newItem.id) {
                return {
                  ...item,
                  thumbnail: result.thumbnail,
                  duration: result.duration || item.duration
                };
              }
              return item;
            });
            return { ...track, items: recalculateStartTimes(newItems) };
          }
          return track;
        }));
      } catch (err) {
        console.error('Failed to generate thumbnail:', err);
      }
    }
  }, [recalculateStartTimes]);

  // Handle file drop on specific track
  const handleTrackFileDrop = useCallback(async (trackId, files) => {
    const filteredFiles = files.filter(file => {
      const ext = file.name?.split('.').pop().toLowerCase();
      const trackType = trackId === 'audio-track' ? 'audio' : 'video';
      const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
      const mediaExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'bmp'];
      
      if (trackType === 'audio') {
        return audioExts.includes(ext);
      }
      return mediaExts.includes(ext);
    });

    for (const file of filteredFiles) {
      const mediaType = detectMediaType(file);
      const path = file.path || (file instanceof File ? URL.createObjectURL(file) : '');
      
      const newItem = {
        id: uuidv4(),
        name: file.name || 'Unknown',
        path,
        type: mediaType,
        duration: mediaType === 'image' ? 5 : 10,
        startTime: 0,
        thumbnail: createPlaceholderThumbnail(mediaType)
      };

      setTracks(prev => prev.map(track => {
        if (track.id === trackId) {
          const newItems = [...track.items, newItem];
          return { ...track, items: recalculateStartTimes(newItems) };
        }
        return track;
      }));

      try {
        const result = await generateThumbnail({ ...file, path, type: mediaType });
        
        setTracks(prev => prev.map(track => {
          if (track.id === trackId) {
            const newItems = track.items.map(item => {
              if (item.id === newItem.id) {
                return {
                  ...item,
                  thumbnail: result.thumbnail,
                  duration: result.duration || item.duration
                };
              }
              return item;
            });
            return { ...track, items: recalculateStartTimes(newItems) };
          }
          return track;
        }));
      } catch (err) {
        console.error('Failed to generate thumbnail:', err);
      }
    }
  }, [recalculateStartTimes]);

  // Handle item selection
  const handleSelectItem = useCallback((item) => {
    setSelectedItemId(item.id);
  }, []);

  // Handle item removal
  const handleRemoveItem = useCallback((trackId, itemId) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const newItems = track.items.filter(item => item.id !== itemId);
        return { ...track, items: recalculateStartTimes(newItems) };
      }
      return track;
    }));
    
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  }, [selectedItemId, recalculateStartTimes]);

  // Handle item reordering
  const handleReorderItems = useCallback((trackId, fromIndex, toIndex) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const newItems = [...track.items];
        const [removed] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, removed);
        return { ...track, items: recalculateStartTimes(newItems) };
      }
      return track;
    }));
  }, [recalculateStartTimes]);

  // Handle time change
  const handleTimeChange = useCallback((time) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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
          <PreviewPlayer
            tracks={tracks}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            filters={filters}
            onTimeChange={handleTimeChange}
            onPlayingChange={setIsPlaying}
            onPlaybackRateChange={setPlaybackRate}
            onFilterChange={handleFilterChange}
          />
        </div>
      </main>
      
      <footer className="app-footer">
        <TimelineEditor
          tracks={tracks}
          zoom={zoom}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
          onRemoveItem={handleRemoveItem}
          onReorderItems={handleReorderItems}
          onZoomChange={setZoom}
          onTimeChange={handleTimeChange}
          onFileDrop={handleTrackFileDrop}
        />
      </footer>
    </div>
  );
}

export default App;
