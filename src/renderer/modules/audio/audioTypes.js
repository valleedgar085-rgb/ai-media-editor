/**
 * Audio Track types and constants for Phase 3
 */

// Audio clip state
export const AUDIO_STATE = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
};

// Audio fade types
export const FADE_TYPE = {
  LINEAR: 'linear',
  EXPONENTIAL: 'exponential',
  LOGARITHMIC: 'logarithmic',
};

// Default audio clip settings
export const DEFAULT_AUDIO_SETTINGS = {
  volume: 1.0, // 0 to 1
  pan: 0, // -1 (left) to 1 (right)
  muted: false,
  solo: false,
  fadeIn: {
    enabled: false,
    duration: 0.5,
    type: FADE_TYPE.LINEAR,
  },
  fadeOut: {
    enabled: false,
    duration: 0.5,
    type: FADE_TYPE.LINEAR,
  },
};

// Default volume keyframe
export const DEFAULT_KEYFRAME = {
  time: 0,
  value: 1.0, // Volume level
  easing: 'linear',
};

// Waveform rendering settings
export const WAVEFORM_SETTINGS = {
  samplesPerPixel: 256,
  waveformColor: '#4a90d9',
  backgroundColor: 'transparent',
  peakColor: '#6ab0f3',
  minHeight: 40,
  maxHeight: 100,
};

// Audio file size limits
export const AUDIO_LIMITS = {
  MAX_FILE_SIZE_MB: 500,
  WARN_FILE_SIZE_MB: 100,
  MAX_DURATION_HOURS: 2,
};

export default {
  AUDIO_STATE,
  FADE_TYPE,
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_KEYFRAME,
  WAVEFORM_SETTINGS,
  AUDIO_LIMITS,
};
