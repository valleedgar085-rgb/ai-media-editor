/**
 * History types and constants for undo/redo
 */

// Action types
export const ACTION_TYPE = {
  // Track actions
  ADD_ITEM: 'add_item',
  REMOVE_ITEM: 'remove_item',
  MOVE_ITEM: 'move_item',
  REORDER_ITEMS: 'reorder_items',
  UPDATE_ITEM: 'update_item',
  
  // Audio actions
  UPDATE_AUDIO_SETTINGS: 'update_audio_settings',
  ADD_AUDIO_KEYFRAME: 'add_audio_keyframe',
  REMOVE_AUDIO_KEYFRAME: 'remove_audio_keyframe',
  
  // Effect actions
  ADD_EFFECT: 'add_effect',
  REMOVE_EFFECT: 'remove_effect',
  UPDATE_EFFECT: 'update_effect',
  
  // Keyframe actions
  ADD_KEYFRAME: 'add_keyframe',
  REMOVE_KEYFRAME: 'remove_keyframe',
  UPDATE_KEYFRAME: 'update_keyframe',
  
  // Transition actions
  ADD_TRANSITION: 'add_transition',
  REMOVE_TRANSITION: 'remove_transition',
  UPDATE_TRANSITION: 'update_transition',
  
  // Filter actions
  UPDATE_FILTERS: 'update_filters',
  RESET_FILTERS: 'reset_filters',
  
  // Project actions
  CLEAR_ALL: 'clear_all',
  LOAD_PROJECT: 'load_project',
  
  // Batch action
  BATCH: 'batch',
};

// History limits
export const HISTORY_LIMITS = {
  MAX_HISTORY_SIZE: 100,
  MAX_BATCH_SIZE: 50,
};

export default {
  ACTION_TYPE,
  HISTORY_LIMITS,
};
