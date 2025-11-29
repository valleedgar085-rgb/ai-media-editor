/**
 * Keyframe types and constants for Phase 3
 */

// Keyframe property types
export const KEYFRAME_PROPERTY = {
  // Transform
  POSITION_X: 'position_x',
  POSITION_Y: 'position_y',
  SCALE_X: 'scale_x',
  SCALE_Y: 'scale_y',
  ROTATION: 'rotation',
  
  // Opacity
  OPACITY: 'opacity',
  
  // Color/Effects
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  SATURATION: 'saturation',
  HUE: 'hue',
  
  // Audio
  VOLUME: 'volume',
  PAN: 'pan',
};

// Easing presets
export const EASING_PRESET = {
  LINEAR: 'linear',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  EASE_IN_CUBIC: 'ease-in-cubic',
  EASE_OUT_CUBIC: 'ease-out-cubic',
  EASE_IN_OUT_CUBIC: 'ease-in-out-cubic',
  EASE_IN_ELASTIC: 'ease-in-elastic',
  EASE_OUT_ELASTIC: 'ease-out-elastic',
  EASE_OUT_BOUNCE: 'ease-out-bounce',
  STEP: 'step',
};

// Easing preset configurations
export const EASING_CONFIG = {
  [EASING_PRESET.LINEAR]: {
    name: 'Linear',
    description: 'Constant rate of change',
  },
  [EASING_PRESET.EASE_IN]: {
    name: 'Ease In',
    description: 'Start slow, end fast',
  },
  [EASING_PRESET.EASE_OUT]: {
    name: 'Ease Out',
    description: 'Start fast, end slow',
  },
  [EASING_PRESET.EASE_IN_OUT]: {
    name: 'Ease In-Out',
    description: 'Slow start and end',
  },
  [EASING_PRESET.EASE_IN_CUBIC]: {
    name: 'Ease In Cubic',
    description: 'More pronounced slow start',
  },
  [EASING_PRESET.EASE_OUT_CUBIC]: {
    name: 'Ease Out Cubic',
    description: 'More pronounced slow end',
  },
  [EASING_PRESET.EASE_IN_OUT_CUBIC]: {
    name: 'Ease In-Out Cubic',
    description: 'More pronounced slow start and end',
  },
  [EASING_PRESET.EASE_IN_ELASTIC]: {
    name: 'Ease In Elastic',
    description: 'Elastic effect at start',
  },
  [EASING_PRESET.EASE_OUT_ELASTIC]: {
    name: 'Ease Out Elastic',
    description: 'Elastic effect at end',
  },
  [EASING_PRESET.EASE_OUT_BOUNCE]: {
    name: 'Bounce',
    description: 'Bouncing effect at end',
  },
  [EASING_PRESET.STEP]: {
    name: 'Step',
    description: 'Instant change at keyframe',
  },
};

// Property ranges
export const PROPERTY_RANGE = {
  [KEYFRAME_PROPERTY.POSITION_X]: { min: -1920, max: 1920, default: 0, unit: 'px' },
  [KEYFRAME_PROPERTY.POSITION_Y]: { min: -1080, max: 1080, default: 0, unit: 'px' },
  [KEYFRAME_PROPERTY.SCALE_X]: { min: 0, max: 4, default: 1, unit: 'x' },
  [KEYFRAME_PROPERTY.SCALE_Y]: { min: 0, max: 4, default: 1, unit: 'x' },
  [KEYFRAME_PROPERTY.ROTATION]: { min: -360, max: 360, default: 0, unit: '°' },
  [KEYFRAME_PROPERTY.OPACITY]: { min: 0, max: 1, default: 1, unit: '' },
  [KEYFRAME_PROPERTY.BRIGHTNESS]: { min: -100, max: 100, default: 0, unit: '' },
  [KEYFRAME_PROPERTY.CONTRAST]: { min: -100, max: 100, default: 0, unit: '' },
  [KEYFRAME_PROPERTY.SATURATION]: { min: -100, max: 100, default: 0, unit: '' },
  [KEYFRAME_PROPERTY.HUE]: { min: -180, max: 180, default: 0, unit: '°' },
  [KEYFRAME_PROPERTY.VOLUME]: { min: 0, max: 1, default: 1, unit: '' },
  [KEYFRAME_PROPERTY.PAN]: { min: -1, max: 1, default: 0, unit: '' },
};

// Default keyframe
export const DEFAULT_KEYFRAME = {
  time: 0,
  value: 0,
  easing: EASING_PRESET.LINEAR,
};

export default {
  KEYFRAME_PROPERTY,
  EASING_PRESET,
  EASING_CONFIG,
  PROPERTY_RANGE,
  DEFAULT_KEYFRAME,
};
