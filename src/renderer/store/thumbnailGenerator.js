// Thumbnail generation utility for images and videos

const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = 80;

/**
 * Generate a thumbnail from an image file
 * @param {string} src - Image source URL or path
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export const generateImageThumbnail = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        let width = THUMBNAIL_WIDTH;
        let height = THUMBNAIL_HEIGHT;
        
        if (aspectRatio > width / height) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }
        
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;
        
        // Fill with dark background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        
        // Center the image
        const x = (THUMBNAIL_WIDTH - width) / 2;
        const y = (THUMBNAIL_HEIGHT - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

/**
 * Generate a thumbnail from a video file
 * @param {string} src - Video source URL or path
 * @param {number} seekTime - Time in seconds to capture the thumbnail (default: 0)
 * @returns {Promise<{thumbnail: string, duration: number}>} - Data URL of the thumbnail and video duration
 */
export const generateVideoThumbnail = (src, seekTime = 0) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    let resolved = false;
    
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.src = '';
      video.load();
    };
    
    const onError = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('Failed to load video'));
      }
    };
    
    const onSeeked = () => {
      if (resolved) return;
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let width = THUMBNAIL_WIDTH;
        let height = THUMBNAIL_HEIGHT;
        
        if (aspectRatio > width / height) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }
        
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;
        
        // Fill with dark background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        
        // Center the video frame
        const x = (THUMBNAIL_WIDTH - width) / 2;
        const y = (THUMBNAIL_HEIGHT - height) / 2;
        
        ctx.drawImage(video, x, y, width, height);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        const duration = video.duration;
        
        resolved = true;
        cleanup();
        resolve({ thumbnail, duration });
      } catch (err) {
        resolved = true;
        cleanup();
        reject(err);
      }
    };
    
    const onLoadedMetadata = () => {
      // Seek to the specified time or 10% into the video
      const targetTime = seekTime > 0 ? seekTime : Math.min(video.duration * 0.1, 1);
      video.currentTime = targetTime;
    };
    
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    
    // Set a timeout to prevent hanging
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('Thumbnail generation timed out'));
      }
    }, 10000);
    
    video.src = src;
  });
};

/**
 * Generate a thumbnail based on file type
 * @param {Object} file - File object with path and type properties
 * @returns {Promise<{thumbnail: string, duration?: number}>}
 */
export const generateThumbnail = async (file) => {
  const path = file.path || (file instanceof File ? URL.createObjectURL(file) : '');
  const name = file.name || file.path || '';
  
  const isVideo = file.type === 'video' || name.match(/\.(mp4|webm|mkv|avi|mov)$/i);
  
  if (isVideo) {
    return generateVideoThumbnail(path);
  } else {
    const thumbnail = await generateImageThumbnail(path);
    return { thumbnail, duration: 5 }; // Default 5 seconds for images
  }
};

/**
 * Create a placeholder thumbnail
 * @param {string} type - 'video', 'image', or 'audio'
 * @returns {string} - Data URL of the placeholder
 */
export const createPlaceholderThumbnail = (type) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = THUMBNAIL_WIDTH;
  canvas.height = THUMBNAIL_HEIGHT;
  
  // Background
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  
  // Icon
  ctx.fillStyle = '#e94560';
  ctx.font = '32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const icons = {
    video: '🎥',
    image: '🖼️',
    audio: '🎵'
  };
  
  ctx.fillText(icons[type] || '📁', THUMBNAIL_WIDTH / 2, THUMBNAIL_HEIGHT / 2);
  
  return canvas.toDataURL('image/png');
};
