/**
 * Project types and constants
 */

// Project version for migration support
export const PROJECT_VERSION = '1.0.0';

// Autosave settings
export const AUTOSAVE_SETTINGS = {
  INTERVAL_MS: 30000, // 30 seconds
  MIN_CHANGE_INTERVAL_MS: 5000, // Minimum 5 seconds between saves
  MAX_AUTOSAVES: 5, // Keep up to 5 autosave versions
};

// Project defaults
export const DEFAULT_PROJECT = {
  version: PROJECT_VERSION,
  name: 'Untitled Project',
  created: null,
  modified: null,
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: '#000000',
  },
  tracks: [],
  transitions: [],
  filters: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  CURRENT_PROJECT: 'ai-media-editor-current-project',
  AUTOSAVE_PREFIX: 'ai-media-editor-autosave-',
  RECENT_PROJECTS: 'ai-media-editor-recent-projects',
  USER_PREFERENCES: 'ai-media-editor-preferences',
};

export default {
  PROJECT_VERSION,
  AUTOSAVE_SETTINGS,
  DEFAULT_PROJECT,
  STORAGE_KEYS,
};
