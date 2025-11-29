import React, { useRef, useEffect, useState, useCallback } from 'react';
import { initWebGL, renderFrame, cleanupWebGL } from './webglRenderer';
import PlaybackControls from './PlaybackControls';
import FilterControls from './FilterControls';

function PreviewPlayer({
  tracks,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  filters,
  onTimeChange,
  onPlayingChange,
  onPlaybackRateChange,
  onFilterChange
}) {
  const canvasRef = useRef(null);
  const webglContextRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const imageRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  const [currentVideoItem, setCurrentVideoItem] = useState(null);
  const [currentAudioItem, setCurrentAudioItem] = useState(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    webglContextRef.current = initWebGL(canvas);
    if (!webglContextRef.current) {
      setError('WebGL initialization failed');
    }

    return () => {
      if (webglContextRef.current) {
        cleanupWebGL(webglContextRef.current);
        webglContextRef.current = null;
      }
    };
  }, []);

  // Find current media items based on time
  useEffect(() => {
    const videoTrack = tracks.find(t => t.type === 'video');
    const audioTrack = tracks.find(t => t.type === 'audio');

    if (videoTrack) {
      const item = videoTrack.items.find(i => 
        currentTime >= i.startTime && currentTime < i.startTime + i.duration
      );
      if (item?.id !== currentVideoItem?.id) {
        setCurrentVideoItem(item || null);
        setMediaLoaded(false);
      }
    }

    if (audioTrack) {
      const item = audioTrack.items.find(i => 
        currentTime >= i.startTime && currentTime < i.startTime + i.duration
      );
      if (item?.id !== currentAudioItem?.id) {
        setCurrentAudioItem(item || null);
      }
    }
  }, [currentTime, tracks, currentVideoItem?.id, currentAudioItem?.id]);

  // Load video or image when current item changes
  useEffect(() => {
    if (!currentVideoItem) {
      setMediaLoaded(false);
      return;
    }

    const isVideo = currentVideoItem.type === 'video' || 
      currentVideoItem.path?.match(/\.(mp4|webm|mkv|avi|mov)$/i);

    if (isVideo) {
      // Load video
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.crossOrigin = 'anonymous';
        videoRef.current.muted = true; // Mute video, use separate audio track
        videoRef.current.playsInline = true;
      }

      videoRef.current.src = currentVideoItem.path;
      videoRef.current.load();
      videoRef.current.onloadeddata = () => {
        setMediaLoaded(true);
        setError(null);
      };
      videoRef.current.onerror = () => {
        setError('Failed to load video');
        setMediaLoaded(false);
      };

      imageRef.current = null;
    } else {
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setMediaLoaded(true);
        setError(null);
      };
      img.onerror = () => {
        setError('Failed to load image');
        setMediaLoaded(false);
      };
      img.src = currentVideoItem.path;

      videoRef.current = null;
    }
  }, [currentVideoItem]);

  // Handle audio track
  useEffect(() => {
    if (!currentAudioItem) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = document.createElement('audio');
      audioRef.current.crossOrigin = 'anonymous';
    }

    audioRef.current.src = currentAudioItem.path;
    audioRef.current.load();
  }, [currentAudioItem]);

  // Sync audio with playback
  useEffect(() => {
    if (!audioRef.current || !currentAudioItem) return;

    const audioTime = currentTime - currentAudioItem.startTime;
    
    if (Math.abs(audioRef.current.currentTime - audioTime) > 0.1) {
      audioRef.current.currentTime = Math.max(0, audioTime);
    }

    audioRef.current.playbackRate = playbackRate;

    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTime, currentAudioItem, playbackRate]);

  // Render loop
  const render = useCallback(() => {
    if (!webglContextRef.current || !canvasRef.current) return;

    let source = null;

    if (videoRef.current && videoRef.current.readyState >= 2) {
      // Sync video time
      const videoTime = currentVideoItem 
        ? currentTime - currentVideoItem.startTime 
        : 0;
      
      if (Math.abs(videoRef.current.currentTime - videoTime) > 0.1) {
        videoRef.current.currentTime = Math.max(0, videoTime);
      }
      
      videoRef.current.playbackRate = playbackRate;
      
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      
      source = videoRef.current;
    } else if (imageRef.current) {
      source = imageRef.current;
    }

    if (source) {
      try {
        renderFrame(webglContextRef.current, source, filters);
      } catch (err) {
        console.error('Render error:', err);
      }
    } else {
      // Clear canvas when no source
      const { gl } = webglContextRef.current;
      gl.clearColor(0.1, 0.1, 0.15, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }, [currentTime, filters, isPlaying, playbackRate, currentVideoItem]);

  // Animation loop for playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      render();
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (timestamp) => {
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const newTime = currentTime + deltaTime * playbackRate;
      
      if (newTime >= duration) {
        onTimeChange(0);
        onPlayingChange(false);
        return;
      }

      onTimeChange(newTime);
      render();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, playbackRate, onTimeChange, onPlayingChange, render]);

  // Render when filters or time changes (not during playback)
  useEffect(() => {
    if (!isPlaying) {
      render();
    }
  }, [filters, render, isPlaying, currentTime]);

  const handlePlayPause = useCallback(() => {
    if (duration === 0) return;
    onPlayingChange(!isPlaying);
  }, [isPlaying, duration, onPlayingChange]);

  const handleSeek = useCallback((time) => {
    onTimeChange(time);
  }, [onTimeChange]);

  const handleFrameStep = useCallback((direction) => {
    // Step by 1/30th of a second (one frame at 30fps)
    const frameTime = 1 / 30;
    const newTime = Math.max(0, Math.min(currentTime + direction * frameTime, duration));
    onTimeChange(newTime);
  }, [currentTime, duration, onTimeChange]);

  const hasMedia = tracks.some(t => t.items.length > 0);

  return (
    <div className="preview-player">
      <div className="preview-canvas-container">
        {!hasMedia ? (
          <div className="preview-empty">
            <div className="preview-empty-icon">🎬</div>
            <p>Add media to the timeline to preview</p>
          </div>
        ) : error ? (
          <div className="preview-error">
            <div className="preview-error-icon">⚠️</div>
            <p>{error}</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            width={640}
            height={360}
          />
        )}
      </div>

      <PlaybackControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onFrameStep={handleFrameStep}
        onPlaybackRateChange={onPlaybackRateChange}
      />

      <FilterControls
        filters={filters}
        onFilterChange={onFilterChange}
      />
    </div>
  );
}

export default PreviewPlayer;
