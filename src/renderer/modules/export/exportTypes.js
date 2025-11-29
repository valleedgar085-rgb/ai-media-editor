/**
 * Export types and constants for Phase 3 export pipeline
 */

// Export formats
export const EXPORT_FORMATS = {
  MP4_H264: 'mp4_h264',
  WEBM_VP9: 'webm_vp9',
};

// Export format configurations
export const FORMAT_CONFIG = {
  [EXPORT_FORMATS.MP4_H264]: {
    extension: 'mp4',
    mimeType: 'video/mp4',
    codec: 'avc1.42E01E', // H.264 Baseline Profile
    audioBitrate: 128000,
    videoBitrate: 5000000,
    description: 'MP4 (H.264) - Widely compatible',
  },
  [EXPORT_FORMATS.WEBM_VP9]: {
    extension: 'webm',
    mimeType: 'video/webm',
    codec: 'vp09.00.10.08',
    audioBitrate: 128000,
    videoBitrate: 4000000,
    description: 'WebM (VP9) - Web optimized',
  },
};

// Export quality presets
export const QUALITY_PRESETS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CUSTOM: 'custom',
};

// Quality preset configurations
export const QUALITY_CONFIG = {
  [QUALITY_PRESETS.LOW]: {
    width: 854,
    height: 480,
    fps: 24,
    videoBitrate: 1500000,
    audioBitrate: 96000,
    description: '480p Low Quality',
  },
  [QUALITY_PRESETS.MEDIUM]: {
    width: 1280,
    height: 720,
    fps: 30,
    videoBitrate: 3500000,
    audioBitrate: 128000,
    description: '720p Medium Quality',
  },
  [QUALITY_PRESETS.HIGH]: {
    width: 1920,
    height: 1080,
    fps: 30,
    videoBitrate: 8000000,
    audioBitrate: 192000,
    description: '1080p High Quality',
  },
};

// Export job status
export const EXPORT_STATUS = {
  QUEUED: 'queued',
  PREPARING: 'preparing',
  ENCODING: 'encoding',
  MIXING_AUDIO: 'mixing_audio',
  FINALIZING: 'finalizing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Default export settings
export const DEFAULT_EXPORT_SETTINGS = {
  format: EXPORT_FORMATS.MP4_H264,
  quality: QUALITY_PRESETS.HIGH,
  width: 1920,
  height: 1080,
  fps: 30,
  videoBitrate: 8000000,
  audioBitrate: 192000,
  includeAudio: true,
  startTime: 0,
  endTime: null, // null means use full duration
};

export default {
  EXPORT_FORMATS,
  FORMAT_CONFIG,
  QUALITY_PRESETS,
  QUALITY_CONFIG,
  EXPORT_STATUS,
  DEFAULT_EXPORT_SETTINGS,
};
