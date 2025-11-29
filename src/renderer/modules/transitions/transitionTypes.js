/**
 * Transitions types and constants for Phase 3
 */

// Transition types
export const TRANSITION_TYPE = {
  NONE: 'none',
  CROSSFADE: 'crossfade',
  WIPE_LEFT: 'wipe_left',
  WIPE_RIGHT: 'wipe_right',
  WIPE_UP: 'wipe_up',
  WIPE_DOWN: 'wipe_down',
  FADE_BLACK: 'fade_black',
  FADE_WHITE: 'fade_white',
};

// Easing functions
export const EASING_TYPE = {
  LINEAR: 'linear',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
};

// Transition configurations
export const TRANSITION_CONFIG = {
  [TRANSITION_TYPE.NONE]: {
    name: 'None',
    description: 'No transition',
    minDuration: 0,
    maxDuration: 0,
  },
  [TRANSITION_TYPE.CROSSFADE]: {
    name: 'Crossfade',
    description: 'Smoothly blend between clips',
    minDuration: 0.1,
    maxDuration: 5.0,
    defaultDuration: 1.0,
  },
  [TRANSITION_TYPE.WIPE_LEFT]: {
    name: 'Wipe Left',
    description: 'Wipe from right to left',
    minDuration: 0.2,
    maxDuration: 3.0,
    defaultDuration: 0.5,
  },
  [TRANSITION_TYPE.WIPE_RIGHT]: {
    name: 'Wipe Right',
    description: 'Wipe from left to right',
    minDuration: 0.2,
    maxDuration: 3.0,
    defaultDuration: 0.5,
  },
  [TRANSITION_TYPE.WIPE_UP]: {
    name: 'Wipe Up',
    description: 'Wipe from bottom to top',
    minDuration: 0.2,
    maxDuration: 3.0,
    defaultDuration: 0.5,
  },
  [TRANSITION_TYPE.WIPE_DOWN]: {
    name: 'Wipe Down',
    description: 'Wipe from top to bottom',
    minDuration: 0.2,
    maxDuration: 3.0,
    defaultDuration: 0.5,
  },
  [TRANSITION_TYPE.FADE_BLACK]: {
    name: 'Fade to Black',
    description: 'Fade out to black, then fade in',
    minDuration: 0.3,
    maxDuration: 5.0,
    defaultDuration: 1.0,
  },
  [TRANSITION_TYPE.FADE_WHITE]: {
    name: 'Fade to White',
    description: 'Fade out to white, then fade in',
    minDuration: 0.3,
    maxDuration: 5.0,
    defaultDuration: 1.0,
  },
};

// Default transition settings
export const DEFAULT_TRANSITION = {
  type: TRANSITION_TYPE.NONE,
  duration: 1.0,
  easing: EASING_TYPE.LINEAR,
};

export default {
  TRANSITION_TYPE,
  EASING_TYPE,
  TRANSITION_CONFIG,
  DEFAULT_TRANSITION,
};
