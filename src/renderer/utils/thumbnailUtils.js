/**
 * Utility functions for generating and managing thumbnails
 */

/**
 * Generate a thumbnail from a video file
 * @param {string} videoPath - Path to the video file
 * @param {number} timeOffset - Time in seconds to capture the thumbnail
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export async function generateVideoThumbnail(videoPath, timeOffset = 0) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Seek to specified time or 10% into the video
      const seekTime = timeOffset || Math.min(video.duration * 0.1, 5);
      video.currentTime = seekTime;
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set thumbnail size - 16:9 aspect ratio, 160px width
        const targetWidth = 160;
        const targetHeight = 90;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Calculate aspect-fit dimensions
        const videoAspect = video.videoWidth / video.videoHeight;
        const targetAspect = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoAspect > targetAspect) {
          drawWidth = targetWidth;
          drawHeight = targetWidth / videoAspect;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        } else {
          drawHeight = targetHeight;
          drawWidth = targetHeight * videoAspect;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        }
        
        // Fill with black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Draw the video frame
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    // Set video source
    video.src = videoPath;
  });
}

/**
 * Generate a thumbnail from an image file
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export async function generateImageThumbnail(imagePath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set thumbnail size
        const targetWidth = 160;
        const targetHeight = 90;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Calculate aspect-fit dimensions
        const imgAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > targetAspect) {
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgAspect;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        } else {
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgAspect;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        }
        
        // Fill with black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imagePath;
  });
}

/**
 * Get video duration
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<number>} - Duration in seconds
 */
export async function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = videoPath;
  });
}

/**
 * Determine if a file path is a video
 * @param {string} path - File path or name
 * @returns {boolean}
 */
export function isVideoFile(path) {
  if (!path) return false;
  const videoExtensions = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'ogg', 'ogv'];
  const ext = path.split('.').pop()?.toLowerCase();
  return videoExtensions.includes(ext);
}

/**
 * Determine if a file path is an image
 * @param {string} path - File path or name
 * @returns {boolean}
 */
export function isImageFile(path) {
  if (!path) return false;
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const ext = path.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * Determine if a file path is an audio file
 * @param {string} path - File path or name
 * @returns {boolean}
 */
export function isAudioFile(path) {
  if (!path) return false;
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
  const ext = path.split('.').pop()?.toLowerCase();
  return audioExtensions.includes(ext);
}

/**
 * Generate appropriate thumbnail based on file type
 * @param {string} path - File path
 * @param {string} type - File type hint ('video', 'image', 'audio')
 * @returns {Promise<string|null>} - Data URL of the thumbnail or null
 */
export async function generateThumbnail(path, type) {
  try {
    if (type === 'video' || isVideoFile(path)) {
      return await generateVideoThumbnail(path);
    } else if (type === 'image' || isImageFile(path)) {
      return await generateImageThumbnail(path);
    } else if (type === 'audio' || isAudioFile(path)) {
      // Return null for audio files - they'll use a placeholder
      return null;
    }
    return null;
  } catch (error) {
    console.warn('Failed to generate thumbnail:', error);
    return null;
  }
}

/**
 * Save thumbnail metadata to localStorage
 * @param {string} itemId - Item ID
 * @param {string} thumbnail - Thumbnail data URL
 */
export function saveThumbnailMetadata(itemId, thumbnail) {
  try {
    const key = `thumbnail_${itemId}`;
    localStorage.setItem(key, thumbnail);
  } catch (error) {
    console.warn('Failed to save thumbnail metadata:', error);
  }
}

/**
 * Load thumbnail metadata from localStorage
 * @param {string} itemId - Item ID
 * @returns {string|null} - Thumbnail data URL or null
 */
export function loadThumbnailMetadata(itemId) {
  try {
    const key = `thumbnail_${itemId}`;
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to load thumbnail metadata:', error);
    return null;
  }
}

/**
 * Clear all thumbnail metadata from localStorage
 */
export function clearThumbnailMetadata() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('thumbnail_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear thumbnail metadata:', error);
  }
}
