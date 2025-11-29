/**
 * Keyframe Track - Manages keyframes for a single property
 */

import { EASING_PRESET, PROPERTY_RANGE, DEFAULT_KEYFRAME } from './keyframeTypes';

/**
 * Generate unique keyframe ID
 */
const generateId = () => `kf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Apply easing function
 * @param {number} t - Progress (0 to 1)
 * @param {string} easing - Easing type
 * @returns {number}
 */
export const applyEasing = (t, easing) => {
  switch (easing) {
    case EASING_PRESET.EASE_IN:
      return t * t;
    
    case EASING_PRESET.EASE_OUT:
      return 1 - Math.pow(1 - t, 2);
    
    case EASING_PRESET.EASE_IN_OUT:
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    case EASING_PRESET.EASE_IN_CUBIC:
      return t * t * t;
    
    case EASING_PRESET.EASE_OUT_CUBIC:
      return 1 - Math.pow(1 - t, 3);
    
    case EASING_PRESET.EASE_IN_OUT_CUBIC:
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    case EASING_PRESET.EASE_IN_ELASTIC: {
      const c = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c);
    }
    
    case EASING_PRESET.EASE_OUT_ELASTIC: {
      const c = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
    }
    
    case EASING_PRESET.EASE_OUT_BOUNCE: {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
    
    case EASING_PRESET.STEP:
      return t < 1 ? 0 : 1;
    
    case EASING_PRESET.LINEAR:
    default:
      return t;
  }
};

/**
 * Keyframe Track class - manages keyframes for one property
 */
class KeyframeTrack {
  constructor(property, options = {}) {
    this.property = property;
    this.keyframes = [];
    this.enabled = options.enabled ?? true;
    
    // Get property range
    this.range = PROPERTY_RANGE[property] || {
      min: 0,
      max: 1,
      default: 0,
      unit: '',
    };
  }

  /**
   * Get the number of keyframes
   * @returns {number}
   */
  get count() {
    return this.keyframes.length;
  }

  /**
   * Add a keyframe
   * @param {number} time - Time in seconds
   * @param {number} value - Property value
   * @param {string} easing - Easing function
   * @returns {Object} - Added keyframe
   */
  addKeyframe(time, value, easing = EASING_PRESET.LINEAR) {
    // Remove existing keyframe at same time (within tolerance)
    this.keyframes = this.keyframes.filter(kf => Math.abs(kf.time - time) > 0.001);
    
    // Clamp value to range
    const clampedValue = Math.max(this.range.min, Math.min(this.range.max, value));
    
    const keyframe = {
      id: generateId(),
      time,
      value: clampedValue,
      easing,
    };
    
    this.keyframes.push(keyframe);
    this.keyframes.sort((a, b) => a.time - b.time);
    
    return keyframe;
  }

  /**
   * Remove a keyframe
   * @param {string} id - Keyframe ID
   */
  removeKeyframe(id) {
    this.keyframes = this.keyframes.filter(kf => kf.id !== id);
  }

  /**
   * Update a keyframe
   * @param {string} id - Keyframe ID
   * @param {Object} updates - Properties to update
   * @returns {Object|null} - Updated keyframe
   */
  updateKeyframe(id, updates) {
    const index = this.keyframes.findIndex(kf => kf.id === id);
    if (index === -1) return null;
    
    const keyframe = this.keyframes[index];
    
    if (updates.time !== undefined) {
      keyframe.time = updates.time;
    }
    if (updates.value !== undefined) {
      keyframe.value = Math.max(this.range.min, Math.min(this.range.max, updates.value));
    }
    if (updates.easing !== undefined) {
      keyframe.easing = updates.easing;
    }
    
    // Re-sort by time
    this.keyframes.sort((a, b) => a.time - b.time);
    
    return keyframe;
  }

  /**
   * Get value at a specific time
   * @param {number} time - Time in seconds
   * @returns {number}
   */
  getValueAtTime(time) {
    if (!this.enabled || this.keyframes.length === 0) {
      return this.range.default;
    }
    
    // Find surrounding keyframes
    let before = null;
    let after = null;
    
    for (const kf of this.keyframes) {
      if (kf.time <= time) {
        before = kf;
      } else {
        after = kf;
        break;
      }
    }
    
    // Handle edge cases
    if (!before && !after) {
      return this.range.default;
    }
    if (!before) {
      return after.value;
    }
    if (!after) {
      return before.value;
    }
    
    // Interpolate between keyframes
    const duration = after.time - before.time;
    if (duration <= 0) {
      return before.value;
    }
    
    const progress = (time - before.time) / duration;
    const easedProgress = applyEasing(progress, before.easing);
    
    return before.value + (after.value - before.value) * easedProgress;
  }

  /**
   * Get keyframe at a specific time (within tolerance)
   * @param {number} time - Time in seconds
   * @param {number} tolerance - Time tolerance
   * @returns {Object|null}
   */
  getKeyframeAtTime(time, tolerance = 0.05) {
    return this.keyframes.find(kf => Math.abs(kf.time - time) <= tolerance) || null;
  }

  /**
   * Get keyframes in a time range
   * @param {number} startTime - Start time
   * @param {number} endTime - End time
   * @returns {Array}
   */
  getKeyframesInRange(startTime, endTime) {
    return this.keyframes.filter(kf => kf.time >= startTime && kf.time <= endTime);
  }

  /**
   * Clear all keyframes
   */
  clear() {
    this.keyframes = [];
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      property: this.property,
      enabled: this.enabled,
      keyframes: this.keyframes.map(kf => ({
        id: kf.id,
        time: kf.time,
        value: kf.value,
        easing: kf.easing,
      })),
    };
  }

  /**
   * Create from JSON
   * @param {Object} data - JSON data
   * @returns {KeyframeTrack}
   */
  static fromJSON(data) {
    const track = new KeyframeTrack(data.property, { enabled: data.enabled });
    track.keyframes = (data.keyframes || []).map(kf => ({
      ...kf,
      id: kf.id || generateId(),
    }));
    return track;
  }
}

export default KeyframeTrack;
