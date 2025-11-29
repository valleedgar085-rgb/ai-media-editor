import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import useEditorStore from '../src/renderer/store/useEditorStore';

// Reset store between tests
beforeEach(() => {
  act(() => {
    useEditorStore.getState().clearAll();
  });
});

describe('useEditorStore', () => {
  describe('Track management', () => {
    test('should have initial tracks (video and audio)', () => {
      const { tracks } = useEditorStore.getState();
      expect(tracks).toHaveLength(2);
      expect(tracks[0].id).toBe('video-track');
      expect(tracks[1].id).toBe('audio-track');
    });

    test('should add media item to video track', () => {
      const { addMediaItem, tracks } = useEditorStore.getState();
      
      act(() => {
        addMediaItem('video-track', {
          name: 'test-video.mp4',
          path: '/path/to/video.mp4',
          type: 'video',
          duration: 10,
        });
      });
      
      const updatedTracks = useEditorStore.getState().tracks;
      const videoTrack = updatedTracks.find(t => t.id === 'video-track');
      expect(videoTrack.items).toHaveLength(1);
      expect(videoTrack.items[0].name).toBe('test-video.mp4');
      expect(videoTrack.items[0].duration).toBe(10);
    });

    test('should add media item to audio track', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('audio-track', {
          name: 'test-audio.mp3',
          path: '/path/to/audio.mp3',
          type: 'audio',
          duration: 30,
        });
      });
      
      const updatedTracks = useEditorStore.getState().tracks;
      const audioTrack = updatedTracks.find(t => t.id === 'audio-track');
      expect(audioTrack.items).toHaveLength(1);
      expect(audioTrack.items[0].name).toBe('test-audio.mp3');
    });

    test('should remove media item from track', () => {
      let itemId;
      act(() => {
        itemId = useEditorStore.getState().addMediaItem('video-track', {
          name: 'test-video.mp4',
          path: '/path/to/video.mp4',
          type: 'video',
          duration: 10,
        });
      });
      
      let videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      expect(videoTrack.items).toHaveLength(1);
      
      act(() => {
        useEditorStore.getState().removeMediaItem('video-track', itemId);
      });
      
      videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      expect(videoTrack.items).toHaveLength(0);
    });

    test('should update duration when adding items', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video1.mp4',
          path: '/path/to/video1.mp4',
          type: 'video',
          duration: 10,
          startTime: 0,
        });
      });
      
      expect(useEditorStore.getState().duration).toBe(10);
      
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video2.mp4',
          path: '/path/to/video2.mp4',
          type: 'video',
          duration: 15,
          startTime: 10,
        });
      });
      
      expect(useEditorStore.getState().duration).toBe(25);
    });
  });

  describe('Reordering items', () => {
    test('should reorder items within a track', () => {
      // Add three items
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'first.mp4',
          type: 'video',
          duration: 5,
        });
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'second.mp4',
          type: 'video',
          duration: 5,
        });
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'third.mp4',
          type: 'video',
          duration: 5,
        });
      });
      
      let videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      expect(videoTrack.items[0].name).toBe('first.mp4');
      expect(videoTrack.items[1].name).toBe('second.mp4');
      expect(videoTrack.items[2].name).toBe('third.mp4');
      
      // Reorder: move first item to last position
      act(() => {
        useEditorStore.getState().reorderItems('video-track', 0, 2);
      });
      
      videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      expect(videoTrack.items[0].name).toBe('second.mp4');
      expect(videoTrack.items[1].name).toBe('third.mp4');
      expect(videoTrack.items[2].name).toBe('first.mp4');
    });

    test('should update startTimes after reordering', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'first.mp4',
          type: 'video',
          duration: 5,
        });
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'second.mp4',
          type: 'video',
          duration: 10,
        });
      });
      
      act(() => {
        useEditorStore.getState().reorderItems('video-track', 0, 1);
      });
      
      const videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      // After reorder: second.mp4 is first (startTime 0), first.mp4 is second (startTime 10)
      expect(videoTrack.items[0].startTime).toBe(0);
      expect(videoTrack.items[1].startTime).toBe(10);
    });

    test('should move item between tracks', () => {
      let itemId;
      act(() => {
        itemId = useEditorStore.getState().addMediaItem('video-track', {
          name: 'movable.mp4',
          type: 'video',
          duration: 5,
        });
      });
      
      let videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      let audioTrack = useEditorStore.getState().tracks.find(t => t.id === 'audio-track');
      expect(videoTrack.items).toHaveLength(1);
      expect(audioTrack.items).toHaveLength(0);
      
      act(() => {
        useEditorStore.getState().moveItemToTrack('video-track', 'audio-track', itemId, 5);
      });
      
      videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      audioTrack = useEditorStore.getState().tracks.find(t => t.id === 'audio-track');
      expect(videoTrack.items).toHaveLength(0);
      expect(audioTrack.items).toHaveLength(1);
      expect(audioTrack.items[0].startTime).toBe(5);
    });
  });

  describe('Zoom controls', () => {
    test('should initialize with zoom level 1', () => {
      expect(useEditorStore.getState().zoom).toBe(1);
    });

    test('should zoom in', () => {
      const initialZoom = useEditorStore.getState().zoom;
      
      act(() => {
        useEditorStore.getState().zoomIn();
      });
      
      expect(useEditorStore.getState().zoom).toBeGreaterThan(initialZoom);
    });

    test('should zoom out', () => {
      act(() => {
        useEditorStore.getState().setZoom(2);
      });
      
      const currentZoom = useEditorStore.getState().zoom;
      
      act(() => {
        useEditorStore.getState().zoomOut();
      });
      
      expect(useEditorStore.getState().zoom).toBeLessThan(currentZoom);
    });

    test('should set zoom directly', () => {
      act(() => {
        useEditorStore.getState().setZoom(5);
      });
      
      expect(useEditorStore.getState().zoom).toBe(5);
    });

    test('should clamp zoom to valid range', () => {
      act(() => {
        useEditorStore.getState().setZoom(100);
      });
      expect(useEditorStore.getState().zoom).toBe(10); // max
      
      act(() => {
        useEditorStore.getState().setZoom(0.001);
      });
      expect(useEditorStore.getState().zoom).toBe(0.1); // min
    });

    test('should fit to view based on container width', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 100,
          startTime: 0,
        });
      });
      
      act(() => {
        useEditorStore.getState().fitToView(500);
      });
      
      // duration is 100, container is 500, so zoom should be 5
      expect(useEditorStore.getState().zoom).toBe(5);
    });
  });

  describe('Playhead controls', () => {
    test('should initialize playhead at 0', () => {
      expect(useEditorStore.getState().playhead).toBe(0);
    });

    test('should set playhead position', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 100,
        });
      });
      
      act(() => {
        useEditorStore.getState().setPlayhead(50);
      });
      
      expect(useEditorStore.getState().playhead).toBe(50);
    });

    test('should clamp playhead to valid range', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 100,
        });
      });
      
      act(() => {
        useEditorStore.getState().setPlayhead(-10);
      });
      expect(useEditorStore.getState().playhead).toBe(0);
      
      act(() => {
        useEditorStore.getState().setPlayhead(200);
      });
      expect(useEditorStore.getState().playhead).toBe(100);
    });

    test('should step forward one frame', () => {
      const fps = 30;
      const frameTime = 1 / fps;
      
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 100,
        });
      });
      
      act(() => {
        useEditorStore.getState().setPlayhead(0);
        useEditorStore.getState().stepForward();
      });
      
      expect(useEditorStore.getState().playhead).toBeCloseTo(frameTime, 5);
    });

    test('should step backward one frame', () => {
      const fps = 30;
      const frameTime = 1 / fps;
      
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 100,
        });
      });
      
      act(() => {
        useEditorStore.getState().setPlayhead(1);
        useEditorStore.getState().stepBackward();
      });
      
      expect(useEditorStore.getState().playhead).toBeCloseTo(1 - frameTime, 5);
    });

    test('should go to start', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 100,
        });
        useEditorStore.getState().setPlayhead(50);
        useEditorStore.getState().goToStart();
      });
      
      expect(useEditorStore.getState().playhead).toBe(0);
    });

    test('should go to end', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 100,
        });
        useEditorStore.getState().goToEnd();
      });
      
      expect(useEditorStore.getState().playhead).toBe(100);
    });
  });

  describe('Playback controls', () => {
    test('should initialize with isPlaying false', () => {
      expect(useEditorStore.getState().isPlaying).toBe(false);
    });

    test('should play', () => {
      act(() => {
        useEditorStore.getState().play();
      });
      
      expect(useEditorStore.getState().isPlaying).toBe(true);
    });

    test('should pause', () => {
      act(() => {
        useEditorStore.getState().play();
        useEditorStore.getState().pause();
      });
      
      expect(useEditorStore.getState().isPlaying).toBe(false);
    });

    test('should toggle playback', () => {
      expect(useEditorStore.getState().isPlaying).toBe(false);
      
      act(() => {
        useEditorStore.getState().togglePlayback();
      });
      expect(useEditorStore.getState().isPlaying).toBe(true);
      
      act(() => {
        useEditorStore.getState().togglePlayback();
      });
      expect(useEditorStore.getState().isPlaying).toBe(false);
    });

    test('should set playback rate', () => {
      act(() => {
        useEditorStore.getState().setPlaybackRate(2);
      });
      
      expect(useEditorStore.getState().playbackRate).toBe(2);
    });

    test('should clamp playback rate', () => {
      act(() => {
        useEditorStore.getState().setPlaybackRate(10);
      });
      expect(useEditorStore.getState().playbackRate).toBe(4); // max
      
      act(() => {
        useEditorStore.getState().setPlaybackRate(0.1);
      });
      expect(useEditorStore.getState().playbackRate).toBe(0.25); // min
    });
  });

  describe('Filter controls', () => {
    test('should initialize with default filters', () => {
      const { filters } = useEditorStore.getState();
      expect(filters.brightness).toBe(0);
      expect(filters.contrast).toBe(0);
      expect(filters.saturation).toBe(0);
    });

    test('should set filter value', () => {
      act(() => {
        useEditorStore.getState().setFilter('brightness', 50);
      });
      
      expect(useEditorStore.getState().filters.brightness).toBe(50);
    });

    test('should clamp filter values', () => {
      act(() => {
        useEditorStore.getState().setFilter('brightness', 200);
      });
      expect(useEditorStore.getState().filters.brightness).toBe(100);
      
      act(() => {
        useEditorStore.getState().setFilter('contrast', -200);
      });
      expect(useEditorStore.getState().filters.contrast).toBe(-100);
    });

    test('should reset filters', () => {
      act(() => {
        useEditorStore.getState().setFilter('brightness', 50);
        useEditorStore.getState().setFilter('contrast', 30);
        useEditorStore.getState().setFilter('saturation', -20);
      });
      
      act(() => {
        useEditorStore.getState().resetFilters();
      });
      
      const { filters } = useEditorStore.getState();
      expect(filters.brightness).toBe(0);
      expect(filters.contrast).toBe(0);
      expect(filters.saturation).toBe(0);
    });
  });

  describe('Selection', () => {
    test('should select an item', () => {
      let itemId;
      act(() => {
        itemId = useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 10,
        });
      });
      
      act(() => {
        useEditorStore.getState().selectItem(itemId);
      });
      
      expect(useEditorStore.getState().selectedItemId).toBe(itemId);
    });

    test('should get selected item', () => {
      let itemId;
      act(() => {
        itemId = useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 10,
        });
        useEditorStore.getState().selectItem(itemId);
      });
      
      const selectedItem = useEditorStore.getState().getSelectedItem();
      expect(selectedItem).not.toBeNull();
      expect(selectedItem.name).toBe('video.mp4');
    });

    test('should clear selection when item is removed', () => {
      let itemId;
      act(() => {
        itemId = useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 10,
        });
        useEditorStore.getState().selectItem(itemId);
      });
      
      expect(useEditorStore.getState().selectedItemId).toBe(itemId);
      
      act(() => {
        useEditorStore.getState().removeMediaItem('video-track', itemId);
      });
      
      expect(useEditorStore.getState().selectedItemId).toBeNull();
    });
  });

  describe('Thumbnail management', () => {
    test('should update item thumbnail', () => {
      let itemId;
      act(() => {
        itemId = useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 10,
        });
      });
      
      const thumbnailData = 'data:image/jpeg;base64,test123';
      
      act(() => {
        useEditorStore.getState().updateItemThumbnail('video-track', itemId, thumbnailData);
      });
      
      const videoTrack = useEditorStore.getState().tracks.find(t => t.id === 'video-track');
      const item = videoTrack.items.find(i => i.id === itemId);
      expect(item.thumbnail).toBe(thumbnailData);
    });
  });

  describe('Clear all', () => {
    test('should clear all items and reset state', () => {
      act(() => {
        useEditorStore.getState().addMediaItem('video-track', {
          name: 'video.mp4',
          type: 'video',
          duration: 10,
        });
        useEditorStore.getState().addMediaItem('audio-track', {
          name: 'audio.mp3',
          type: 'audio',
          duration: 30,
        });
        useEditorStore.getState().setPlayhead(5);
        useEditorStore.getState().play();
      });
      
      act(() => {
        useEditorStore.getState().clearAll();
      });
      
      const state = useEditorStore.getState();
      expect(state.tracks[0].items).toHaveLength(0);
      expect(state.tracks[1].items).toHaveLength(0);
      expect(state.playhead).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.selectedItemId).toBeNull();
    });
  });
});
