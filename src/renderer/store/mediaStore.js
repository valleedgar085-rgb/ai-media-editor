import React from 'react';
import { v4 as uuidv4 } from 'uuid';

// Simple state management for media items
const createMediaStore = () => {
  let state = {
    tracks: [
      { id: 'video-track', type: 'video', name: 'Video Track', items: [] },
      { id: 'audio-track', type: 'audio', name: 'Audio Track', items: [] }
    ],
    currentTime: 0,
    duration: 0,
    zoom: 1, // pixels per second
    playheadPosition: 0,
    isPlaying: false,
    playbackRate: 1,
    filters: {
      brightness: 100, // 0-200, 100 is normal
      contrast: 100,   // 0-200, 100 is normal
      saturation: 100  // 0-200, 100 is normal
    }
  };

  const listeners = new Set();

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const notify = () => {
    listeners.forEach(listener => listener(state));
  };

  const getState = () => state;

  const addMediaItem = (trackId, file, thumbnail = null) => {
    const item = {
      id: uuidv4(),
      name: file.name || file.path?.split(/[/\\]/).pop() || 'Unknown',
      path: file.path || (file instanceof File ? URL.createObjectURL(file) : ''),
      type: file.type || detectMediaType(file),
      duration: file.duration || 5, // default 5 seconds for images
      startTime: calculateStartTime(trackId),
      thumbnail: thumbnail,
      width: 0,
      height: 0
    };

    state = {
      ...state,
      tracks: state.tracks.map(track => 
        track.id === trackId 
          ? { ...track, items: [...track.items, item] }
          : track
      )
    };
    
    updateDuration();
    notify();
    return item;
  };

  const removeMediaItem = (trackId, itemId) => {
    state = {
      ...state,
      tracks: state.tracks.map(track => 
        track.id === trackId 
          ? { ...track, items: track.items.filter(item => item.id !== itemId) }
          : track
      )
    };
    
    updateDuration();
    notify();
  };

  const moveMediaItem = (sourceTrackId, targetTrackId, itemId, newIndex) => {
    let item = null;
    
    // Find and remove item from source track
    state = {
      ...state,
      tracks: state.tracks.map(track => {
        if (track.id === sourceTrackId) {
          const itemIndex = track.items.findIndex(i => i.id === itemId);
          if (itemIndex !== -1) {
            item = track.items[itemIndex];
            return { ...track, items: track.items.filter(i => i.id !== itemId) };
          }
        }
        return track;
      })
    };

    if (!item) return;

    // Add item to target track at new index
    state = {
      ...state,
      tracks: state.tracks.map(track => {
        if (track.id === targetTrackId) {
          const newItems = [...track.items];
          newItems.splice(newIndex, 0, item);
          return { ...track, items: newItems };
        }
        return track;
      })
    };

    recalculateStartTimes(targetTrackId);
    notify();
  };

  const reorderItems = (trackId, fromIndex, toIndex) => {
    state = {
      ...state,
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          const newItems = [...track.items];
          const [removed] = newItems.splice(fromIndex, 1);
          newItems.splice(toIndex, 0, removed);
          return { ...track, items: newItems };
        }
        return track;
      })
    };

    recalculateStartTimes(trackId);
    notify();
  };

  const updateItemThumbnail = (trackId, itemId, thumbnail) => {
    state = {
      ...state,
      tracks: state.tracks.map(track => 
        track.id === trackId 
          ? {
              ...track,
              items: track.items.map(item => 
                item.id === itemId ? { ...item, thumbnail } : item
              )
            }
          : track
      )
    };
    notify();
  };

  const updateItemDuration = (trackId, itemId, duration) => {
    state = {
      ...state,
      tracks: state.tracks.map(track => 
        track.id === trackId 
          ? {
              ...track,
              items: track.items.map(item => 
                item.id === itemId ? { ...item, duration } : item
              )
            }
          : track
      )
    };
    
    recalculateStartTimes(trackId);
    updateDuration();
    notify();
  };

  const setCurrentTime = (time) => {
    state = { ...state, currentTime: Math.max(0, Math.min(time, state.duration)) };
    notify();
  };

  const setZoom = (zoom) => {
    state = { ...state, zoom: Math.max(10, Math.min(200, zoom)) };
    notify();
  };

  const setIsPlaying = (isPlaying) => {
    state = { ...state, isPlaying };
    notify();
  };

  const setPlaybackRate = (rate) => {
    state = { ...state, playbackRate: Math.max(0.25, Math.min(4, rate)) };
    notify();
  };

  const setFilters = (filters) => {
    state = { ...state, filters: { ...state.filters, ...filters } };
    notify();
  };

  // Helper functions
  const detectMediaType = (file) => {
    const name = file.name || file.path || '';
    if (name.match(/\.(mp4|webm|mkv|avi|mov)$/i)) return 'video';
    if (name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) return 'audio';
    return 'image';
  };

  const calculateStartTime = (trackId) => {
    const track = state.tracks.find(t => t.id === trackId);
    if (!track || track.items.length === 0) return 0;
    
    const lastItem = track.items[track.items.length - 1];
    return lastItem.startTime + lastItem.duration;
  };

  const recalculateStartTimes = (trackId) => {
    state = {
      ...state,
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          let currentTime = 0;
          const newItems = track.items.map(item => {
            const newItem = { ...item, startTime: currentTime };
            currentTime += item.duration;
            return newItem;
          });
          return { ...track, items: newItems };
        }
        return track;
      })
    };
  };

  const updateDuration = () => {
    const maxDuration = state.tracks.reduce((max, track) => {
      const trackDuration = track.items.reduce((sum, item) => 
        Math.max(sum, item.startTime + item.duration), 0
      );
      return Math.max(max, trackDuration);
    }, 0);
    
    state = { ...state, duration: maxDuration };
  };

  const getItemAtTime = (time, trackType = 'video') => {
    const track = state.tracks.find(t => t.type === trackType);
    if (!track) return null;
    
    return track.items.find(item => 
      time >= item.startTime && time < item.startTime + item.duration
    ) || null;
  };

  const getAllItemsAtTime = (time) => {
    return state.tracks.reduce((items, track) => {
      const item = track.items.find(i => 
        time >= i.startTime && time < i.startTime + i.duration
      );
      if (item) {
        items[track.type] = item;
      }
      return items;
    }, {});
  };

  return {
    subscribe,
    getState,
    addMediaItem,
    removeMediaItem,
    moveMediaItem,
    reorderItems,
    updateItemThumbnail,
    updateItemDuration,
    setCurrentTime,
    setZoom,
    setIsPlaying,
    setPlaybackRate,
    setFilters,
    getItemAtTime,
    getAllItemsAtTime
  };
};

// Singleton instance
export const mediaStore = createMediaStore();

/**
 * React hook for using the media store.
 * Provides reactive access to store state in React components.
 * @returns {Object} Current store state
 * @example
 * function MyComponent() {
 *   const { tracks, currentTime, filters } = useMediaStore();
 *   return <div>{currentTime}</div>;
 * }
 */
export const useMediaStore = () => {
  const [state, setState] = React.useState(mediaStore.getState());

  React.useEffect(() => {
    return mediaStore.subscribe(setState);
  }, []);

  return state;
};
