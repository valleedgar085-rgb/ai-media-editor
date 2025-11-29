import { create } from 'zustand';

/**
 * Generate a unique ID for media items
 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Main editor store for Phase 2 timeline and preview features
 */
const useEditorStore = create((set, get) => ({
  // Media tracks - supports multiple lanes
  tracks: [
    { id: 'video-track', name: 'Video Track', type: 'video', items: [] },
    { id: 'audio-track', name: 'Audio Track', type: 'audio', items: [] },
  ],
  
  // Currently selected item
  selectedItemId: null,
  
  // Timeline state
  zoom: 1, // pixels per second
  scrollPosition: 0,
  playhead: 0, // current time in seconds
  duration: 0, // total timeline duration
  
  // Playback state
  isPlaying: false,
  playbackRate: 1,
  
  // Filters - applied via WebGL shader uniforms
  filters: {
    brightness: 0,   // -100 to 100
    contrast: 0,     // -100 to 100
    saturation: 0,   // -100 to 100
  },
  
  // Add media item to a track
  addMediaItem: (trackId, item) => {
    const newItem = {
      id: generateId(),
      name: item.name || 'Untitled',
      path: item.path,
      type: item.type || 'video',
      thumbnail: item.thumbnail || null,
      startTime: item.startTime || get().duration,
      duration: item.duration || 5, // default 5 seconds for images
      ...item,
    };
    
    set((state) => {
      const tracks = state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: [...track.items, newItem],
          };
        }
        return track;
      });
      
      // Update total duration
      const newDuration = Math.max(
        state.duration,
        newItem.startTime + newItem.duration
      );
      
      return { tracks, duration: newDuration };
    });
    
    return newItem.id;
  },
  
  // Remove media item from a track
  removeMediaItem: (trackId, itemId) => {
    set((state) => {
      const tracks = state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.filter(item => item.id !== itemId),
          };
        }
        return track;
      });
      
      // Recalculate duration
      let maxEndTime = 0;
      tracks.forEach(track => {
        track.items.forEach(item => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });
      
      return {
        tracks,
        duration: maxEndTime,
        selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      };
    });
  },
  
  // Move item within a track (reorder by changing startTime)
  moveMediaItem: (trackId, itemId, newStartTime) => {
    set((state) => {
      const tracks = state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                return { ...item, startTime: Math.max(0, newStartTime) };
              }
              return item;
            }),
          };
        }
        return track;
      });
      
      // Recalculate duration
      let maxEndTime = 0;
      tracks.forEach(track => {
        track.items.forEach(item => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });
      
      return { tracks, duration: maxEndTime };
    });
  },
  
  // Reorder items within a track
  reorderItems: (trackId, fromIndex, toIndex) => {
    set((state) => {
      const tracks = state.tracks.map(track => {
        if (track.id === trackId) {
          const items = [...track.items];
          const [removed] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, removed);
          
          // Recalculate start times based on new order
          let currentTime = 0;
          const updatedItems = items.map(item => {
            const updatedItem = { ...item, startTime: currentTime };
            currentTime += item.duration;
            return updatedItem;
          });
          
          return { ...track, items: updatedItems };
        }
        return track;
      });
      
      // Recalculate duration
      let maxEndTime = 0;
      tracks.forEach(track => {
        track.items.forEach(item => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });
      
      return { tracks, duration: maxEndTime };
    });
  },
  
  // Move item between tracks
  moveItemToTrack: (fromTrackId, toTrackId, itemId, newStartTime) => {
    set((state) => {
      let movedItem = null;
      
      const tracks = state.tracks.map(track => {
        if (track.id === fromTrackId) {
          movedItem = track.items.find(item => item.id === itemId);
          return {
            ...track,
            items: track.items.filter(item => item.id !== itemId),
          };
        }
        return track;
      }).map(track => {
        if (track.id === toTrackId && movedItem) {
          return {
            ...track,
            items: [...track.items, { ...movedItem, startTime: newStartTime }],
          };
        }
        return track;
      });
      
      // Recalculate duration
      let maxEndTime = 0;
      tracks.forEach(track => {
        track.items.forEach(item => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });
      
      return { tracks, duration: maxEndTime };
    });
  },
  
  // Select an item
  selectItem: (itemId) => {
    set({ selectedItemId: itemId });
  },
  
  // Get the selected item
  getSelectedItem: () => {
    const state = get();
    if (!state.selectedItemId) return null;
    
    for (const track of state.tracks) {
      const item = track.items.find(i => i.id === state.selectedItemId);
      if (item) return item;
    }
    return null;
  },
  
  // Zoom controls
  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(10, zoom)) });
  },
  
  zoomIn: () => {
    set((state) => ({ zoom: Math.min(10, state.zoom * 1.2) }));
  },
  
  zoomOut: () => {
    set((state) => ({ zoom: Math.max(0.1, state.zoom / 1.2) }));
  },
  
  fitToView: (containerWidth) => {
    const state = get();
    if (state.duration > 0 && containerWidth > 0) {
      const newZoom = containerWidth / state.duration;
      set({ zoom: Math.max(0.1, Math.min(10, newZoom)) });
    }
  },
  
  // Scroll position
  setScrollPosition: (position) => {
    set({ scrollPosition: Math.max(0, position) });
  },
  
  // Playhead controls
  setPlayhead: (time) => {
    set({ playhead: Math.max(0, Math.min(get().duration, time)) });
  },
  
  // Playback controls
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setPlaybackRate: (rate) => {
    set({ playbackRate: Math.max(0.25, Math.min(4, rate)) });
  },
  
  // Frame step (at 30fps = 1/30 second per frame)
  stepForward: () => {
    const fps = 30;
    set((state) => ({
      playhead: Math.min(state.duration, state.playhead + 1 / fps),
      isPlaying: false,
    }));
  },
  
  stepBackward: () => {
    const fps = 30;
    set((state) => ({
      playhead: Math.max(0, state.playhead - 1 / fps),
      isPlaying: false,
    }));
  },
  
  // Go to start/end
  goToStart: () => set({ playhead: 0, isPlaying: false }),
  goToEnd: () => set((state) => ({ playhead: state.duration, isPlaying: false })),
  
  // Filter controls
  setFilter: (filterName, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [filterName]: Math.max(-100, Math.min(100, value)),
      },
    }));
  },
  
  resetFilters: () => {
    set({
      filters: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
    });
  },
  
  // Update item thumbnail
  updateItemThumbnail: (trackId, itemId, thumbnail) => {
    set((state) => ({
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                return { ...item, thumbnail };
              }
              return item;
            }),
          };
        }
        return track;
      }),
    }));
  },
  
  // Update item duration
  updateItemDuration: (trackId, itemId, duration) => {
    set((state) => {
      const tracks = state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                return { ...item, duration: Math.max(0.1, duration) };
              }
              return item;
            }),
          };
        }
        return track;
      });
      
      // Recalculate duration
      let maxEndTime = 0;
      tracks.forEach(track => {
        track.items.forEach(item => {
          const endTime = item.startTime + item.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });
      
      return { tracks, duration: maxEndTime };
    });
  },
  
  // Clear all items
  clearAll: () => {
    set({
      tracks: [
        { id: 'video-track', name: 'Video Track', type: 'video', items: [] },
        { id: 'audio-track', name: 'Audio Track', type: 'audio', items: [] },
      ],
      selectedItemId: null,
      playhead: 0,
      duration: 0,
      isPlaying: false,
    });
  },
}));

export default useEditorStore;
