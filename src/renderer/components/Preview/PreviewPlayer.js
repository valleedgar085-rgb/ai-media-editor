import React, { useRef, useEffect, useCallback, useState } from 'react';
import useEditorStore from '../../store/useEditorStore';
import WebGLRenderer from '../../utils/WebGLRenderer';
import PlaybackControls from './PlaybackControls';
import FilterControls from './FilterControls';

/**
 * PreviewPlayer component - plays selected media with WebGL rendering
 */
function PreviewPlayer() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioRef = useRef(null);
  
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 540 });
  const [hasWebGL, setHasWebGL] = useState(true);
  
  const {
    tracks,
    selectedItemId,
    playhead,
    isPlaying,
    playbackRate,
    filters,
    duration,
    setPlayhead,
    pause,
  } = useEditorStore();
  
  // Find the selected item
  const selectedItem = useCallback(() => {
    for (const track of tracks) {
      const item = track.items.find(i => i.id === selectedItemId);
      if (item) return item;
    }
    return null;
  }, [tracks, selectedItemId])();
  
  // Get current media at playhead position
  const getCurrentMedia = useCallback(() => {
    const videoTrack = tracks.find(t => t.type === 'video');
    if (!videoTrack) return null;
    
    // Find item that contains the current playhead position
    const currentItem = videoTrack.items.find(item => {
      const endTime = item.startTime + item.duration;
      return playhead >= item.startTime && playhead < endTime;
    });
    
    return currentItem;
  }, [tracks, playhead]);
  
  // Get current audio at playhead position
  const getCurrentAudio = useCallback(() => {
    const audioTrack = tracks.find(t => t.type === 'audio');
    if (!audioTrack) return null;
    
    const currentAudio = audioTrack.items.find(item => {
      const endTime = item.startTime + item.duration;
      return playhead >= item.startTime && playhead < endTime;
    });
    
    return currentAudio;
  }, [tracks, playhead]);
  
  // Initialize WebGL renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new WebGLRenderer(canvasRef.current);
      setHasWebGL(rendererRef.current.isWebGLAvailable());
    }
    
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);
  
  // Update renderer size
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setSize(canvasSize.width, canvasSize.height);
    }
  }, [canvasSize]);
  
  // Update filters in renderer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setFilters(filters);
    }
  }, [filters]);
  
  // Handle video element
  useEffect(() => {
    const currentMedia = getCurrentMedia();
    
    if (currentMedia && videoRef.current) {
      const isVideo = currentMedia.type === 'video' || currentMedia.path?.match(/\.(mp4|webm|mkv|avi|mov)$/i);
      
      if (isVideo && videoRef.current.src !== currentMedia.path) {
        videoRef.current.src = currentMedia.path;
        videoRef.current.load();
      }
    }
  }, [getCurrentMedia]);
  
  // Handle image element
  useEffect(() => {
    const currentMedia = getCurrentMedia();
    
    if (currentMedia && imageRef.current) {
      const isImage = currentMedia.type === 'image' || currentMedia.path?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
      
      if (isImage && imageRef.current.src !== currentMedia.path) {
        imageRef.current.src = currentMedia.path;
      }
    }
  }, [getCurrentMedia]);
  
  // Handle audio sync
  useEffect(() => {
    const currentAudio = getCurrentAudio();
    
    if (audioRef.current) {
      if (currentAudio) {
        if (audioRef.current.src !== currentAudio.path) {
          audioRef.current.src = currentAudio.path;
          audioRef.current.load();
        }
        
        // Calculate local time within the audio clip
        const localTime = playhead - currentAudio.startTime;
        
        if (Math.abs(audioRef.current.currentTime - localTime) > 0.3) {
          audioRef.current.currentTime = localTime;
        }
        
        audioRef.current.playbackRate = playbackRate;
        
        if (isPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        } else if (!isPlaying && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [getCurrentAudio, playhead, isPlaying, playbackRate]);
  
  // Playback loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    let lastTime = performance.now();
    
    const tick = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      const newPlayhead = playhead + deltaTime * playbackRate;
      
      if (newPlayhead >= duration) {
        setPlayhead(duration);
        pause();
        return;
      }
      
      setPlayhead(newPlayhead);
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    
    animationFrameRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playhead, duration, playbackRate, setPlayhead, pause]);
  
  // Render frame
  useEffect(() => {
    const currentMedia = getCurrentMedia();
    
    if (!rendererRef.current || !currentMedia) {
      // Clear canvas if no media
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        }
      }
      return;
    }
    
    const isVideo = currentMedia.type === 'video' || currentMedia.path?.match(/\.(mp4|webm|mkv|avi|mov)$/i);
    
    if (isVideo && videoRef.current && videoRef.current.readyState >= 2) {
      // Calculate local time within the video clip
      const localTime = playhead - currentMedia.startTime;
      
      // Sync video position
      if (Math.abs(videoRef.current.currentTime - localTime) > 0.1) {
        videoRef.current.currentTime = Math.max(0, localTime);
      }
      
      videoRef.current.playbackRate = playbackRate;
      
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      
      // Render video frame to canvas
      rendererRef.current.render(videoRef.current);
    } else if (!isVideo && imageRef.current && imageRef.current.complete) {
      // Render image to canvas
      rendererRef.current.render(imageRef.current);
    }
  }, [getCurrentMedia, playhead, isPlaying, playbackRate, canvasSize]);
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const maxWidth = container.clientWidth - 40;
        const maxHeight = container.clientHeight - 200;
        
        // Maintain 16:9 aspect ratio
        const aspectRatio = 16 / 9;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        setCanvasSize({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const currentMedia = getCurrentMedia();
  
  return (
    <div className="preview-player">
      {/* Canvas for rendering */}
      <div className="preview-canvas-container">
        <canvas
          ref={canvasRef}
          className="preview-canvas"
          width={canvasSize.width}
          height={canvasSize.height}
        />
        
        {/* Hidden video element for loading video frames */}
        <video
          ref={videoRef}
          className="hidden-media"
          preload="auto"
          muted
          playsInline
        />
        
        {/* Hidden image element for loading images */}
        <img
          ref={imageRef}
          className="hidden-media"
          alt=""
        />
        
        {/* Hidden audio element for audio playback */}
        <audio
          ref={audioRef}
          className="hidden-media"
          preload="auto"
        />
        
        {/* Empty state */}
        {!currentMedia && duration === 0 && (
          <div className="preview-empty">
            <div className="preview-icon">🎬</div>
            <p>Add media to the timeline to preview</p>
          </div>
        )}
        
        {/* No media at playhead */}
        {!currentMedia && duration > 0 && (
          <div className="preview-empty">
            <div className="preview-icon">⏸️</div>
            <p>No media at current playhead position</p>
          </div>
        )}
        
        {/* WebGL info */}
        {!hasWebGL && (
          <div className="webgl-warning">
            WebGL not available. Using fallback rendering.
          </div>
        )}
        
        {/* Current media info */}
        {currentMedia && (
          <div className="preview-media-info">
            <span className="media-name">{currentMedia.name}</span>
          </div>
        )}
      </div>
      
      {/* Playback controls */}
      <PlaybackControls />
      
      {/* Filter controls */}
      <FilterControls />
    </div>
  );
}

export default PreviewPlayer;
