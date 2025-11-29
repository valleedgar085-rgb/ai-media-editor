import { create } from 'zustand';

/**
 * Generate a unique ID for media items
 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

/**
 * Default audio item settings
 */
const DEFAULT_AUDIO_ITEM = {
  volume: 1.0,
  pan: 0,
  muted: false,
  solo: false,
  fadeIn: { enabled: false, duration: 0.5 },
  fadeOut: { enabled: false, duration: 0.5 },
  volumeKeyframes: [],
};

/**
 * Main editor store for Phase 2 & 3 timeline and preview features
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
  
  // Phase 3: Transitions between clips
  transitions: [],
  
  // Phase 3: Export state
  exportJobs: [],
  
  // Phase 3: Project state
  projectId: null,
  projectName: 'Untitled Project',
  isDirty: false,
  
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
      transitions: [],
      isDirty: false,
    });
  },
  
  // Phase 3: Audio item settings
  updateAudioSettings: (trackId, itemId, settings) => {
    set((state) => ({
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                return { ...item, ...settings };
              }
              return item;
            }),
          };
        }
        return track;
      }),
      isDirty: true,
    }));
  },
  
  // Phase 3: Add volume keyframe
  addVolumeKeyframe: (trackId, itemId, time, value, easing = 'linear') => {
    set((state) => ({
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                const keyframes = item.volumeKeyframes || [];
                const newKeyframes = keyframes.filter(kf => Math.abs(kf.time - time) > 0.01);
                newKeyframes.push({ id: generateId(), time, value, easing });
                newKeyframes.sort((a, b) => a.time - b.time);
                return { ...item, volumeKeyframes: newKeyframes };
              }
              return item;
            }),
          };
        }
        return track;
      }),
      isDirty: true,
    }));
  },
  
  // Phase 3: Remove volume keyframe
  removeVolumeKeyframe: (trackId, itemId, keyframeId) => {
    set((state) => ({
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  volumeKeyframes: (item.volumeKeyframes || []).filter(kf => kf.id !== keyframeId),
                };
              }
              return item;
            }),
          };
        }
        return track;
      }),
      isDirty: true,
    }));
  },
  
  // Phase 3: Toggle mute for audio item
  toggleMute: (trackId, itemId) => {
    set((state) => ({
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                return { ...item, muted: !item.muted };
              }
              return item;
            }),
          };
        }
        return track;
      }),
      isDirty: true,
    }));
  },
  
  // Phase 3: Toggle solo for audio item
  toggleSolo: (trackId, itemId) => {
    set((state) => ({
      tracks: state.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            items: track.items.map(item => {
              if (item.id === itemId) {
                return { ...item, solo: !item.solo };
              }
              return item;
            }),
          };
        }
        return track;
      }),
      isDirty: true,
    }));
  },
  
  // Phase 3: Add transition between clips
  addTransition: (transition) => {
    const newTransition = {
      id: generateId(),
      type: 'crossfade',
      duration: 1.0,
      easing: 'linear',
      ...transition,
    };
    
    set((state) => ({
      transitions: [...state.transitions, newTransition],
      isDirty: true,
    }));
    
    return newTransition.id;
  },
  
  // Phase 3: Remove transition
  removeTransition: (transitionId) => {
    set((state) => ({
      transitions: state.transitions.filter(t => t.id !== transitionId),
      isDirty: true,
    }));
  },
  
  // Phase 3: Update transition
  updateTransition: (transitionId, updates) => {
    set((state) => ({
      transitions: state.transitions.map(t => 
        t.id === transitionId ? { ...t, ...updates } : t
      ),
      isDirty: true,
    }));
  },
  
  // Phase 3: Get transitions for a clip
  getTransitionsForClip: (clipId) => {
    const state = get();
    return state.transitions.filter(
      t => t.fromClipId === clipId || t.toClipId === clipId
    );
  },
  
  // Phase 3: Set project info
  setProjectInfo: (projectId, projectName) => {
    set({ projectId, projectName, isDirty: false });
  },
  
  // Phase 3: Mark project as dirty
  markDirty: () => {
    set({ isDirty: true });
  },
  
  // Phase 3: Mark project as saved
  markSaved: () => {
    set({ isDirty: false });
  },
  
  // Phase 3: Load project state
  loadProject: (projectData) => {
    set({
      tracks: projectData.tracks || [
        { id: 'video-track', name: 'Video Track', type: 'video', items: [] },
        { id: 'audio-track', name: 'Audio Track', type: 'audio', items: [] },
      ],
      transitions: projectData.transitions || [],
      filters: projectData.filters || { brightness: 0, contrast: 0, saturation: 0 },
      projectId: projectData.id || null,
      projectName: projectData.name || 'Untitled Project',
      duration: projectData.duration || 0,
      selectedItemId: null,
      playhead: 0,
      isPlaying: false,
      isDirty: false,
    });
  },
  
  // Phase 3: Get project data for saving
  getProjectData: () => {
    const state = get();
    return {
      tracks: state.tracks,
      transitions: state.transitions,
      filters: state.filters,
      duration: state.duration,
    };
  },
  
  // Phase 3: Split audio/video clip at playhead
  splitClip: (trackId, itemId) => {
    const state = get();
    const track = state.tracks.find(t => t.id === trackId);
    if (!track) return null;
    
    const item = track.items.find(i => i.id === itemId);
    if (!item) return null;
    
    const splitTime = state.playhead - item.startTime;
    if (splitTime <= 0 || splitTime >= item.duration) return null;
    
    const newItem = {
      ...item,
      id: generateId(),
      name: `${item.name} (split)`,
      startTime: state.playhead,
      duration: item.duration - splitTime,
    };
    
    set((state) => ({
      tracks: state.tracks.map(t => {
        if (t.id === trackId) {
          return {
            ...t,
            items: [
              ...t.items.map(i => i.id === itemId ? { ...i, duration: splitTime } : i),
              newItem,
            ],
          };
        }
        return t;
      }),
      isDirty: true,
    }));
    
    return newItem.id;
  },
}));

export default useEditorStore;
