/**
 * Transition class - Manages transitions between clips
 */

import { TRANSITION_TYPE, EASING_TYPE, TRANSITION_CONFIG, DEFAULT_TRANSITION } from './transitionTypes';

/**
 * Generate unique transition ID
 */
const generateId = () => `transition-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Apply easing function to progress value
 * @param {number} t - Progress (0 to 1)
 * @param {string} easing - Easing type
 * @returns {number}
 */
export const applyEasing = (t, easing) => {
  switch (easing) {
    case EASING_TYPE.EASE_IN:
      return t * t;
    case EASING_TYPE.EASE_OUT:
      return 1 - Math.pow(1 - t, 2);
    case EASING_TYPE.EASE_IN_OUT:
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case EASING_TYPE.LINEAR:
    default:
      return t;
  }
};

/**
 * Transition class
 */
class Transition {
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.type = options.type || DEFAULT_TRANSITION.type;
    this.duration = options.duration || this.getDefaultDuration();
    this.easing = options.easing || DEFAULT_TRANSITION.easing;
    
    // Clips this transition connects
    this.fromClipId = options.fromClipId || null;
    this.toClipId = options.toClipId || null;
  }

  /**
   * Get the default duration for this transition type
   * @returns {number}
   */
  getDefaultDuration() {
    const config = TRANSITION_CONFIG[this.type];
    return config?.defaultDuration || 1.0;
  }

  /**
   * Set the transition type
   * @param {string} type - Transition type
   */
  setType(type) {
    if (TRANSITION_CONFIG[type]) {
      this.type = type;
      this.duration = Math.max(
        TRANSITION_CONFIG[type].minDuration,
        Math.min(TRANSITION_CONFIG[type].maxDuration, this.duration)
      );
    }
  }

  /**
   * Set the duration
   * @param {number} duration - Duration in seconds
   */
  setDuration(duration) {
    const config = TRANSITION_CONFIG[this.type];
    if (config) {
      this.duration = Math.max(
        config.minDuration,
        Math.min(config.maxDuration, duration)
      );
    }
  }

  /**
   * Get the transition progress at a given time
   * @param {number} time - Time relative to transition start
   * @returns {number} - Progress (0 to 1)
   */
  getProgress(time) {
    if (this.type === TRANSITION_TYPE.NONE) return 0;
    if (this.duration <= 0) return 1;
    
    const rawProgress = Math.max(0, Math.min(1, time / this.duration));
    return applyEasing(rawProgress, this.easing);
  }

  /**
   * Calculate opacity values for crossfade
   * @param {number} progress - Transition progress (0 to 1)
   * @returns {Object} - { fromOpacity, toOpacity }
   */
  getCrossfadeOpacities(progress) {
    return {
      fromOpacity: 1 - progress,
      toOpacity: progress,
    };
  }

  /**
   * Calculate wipe position
   * @param {number} progress - Transition progress (0 to 1)
   * @returns {Object} - Wipe position data
   */
  getWipePosition(progress) {
    const direction = this.type.replace('wipe_', '');
    
    switch (direction) {
      case 'left':
        return { clipX: (1 - progress) * 100, clipY: 0, horizontal: true, reverse: true };
      case 'right':
        return { clipX: progress * 100, clipY: 0, horizontal: true, reverse: false };
      case 'up':
        return { clipX: 0, clipY: (1 - progress) * 100, horizontal: false, reverse: true };
      case 'down':
        return { clipX: 0, clipY: progress * 100, horizontal: false, reverse: false };
      default:
        return { clipX: 0, clipY: 0, horizontal: true, reverse: false };
    }
  }

  /**
   * Calculate fade color opacity
   * @param {number} progress - Transition progress (0 to 1)
   * @returns {Object} - { colorOpacity, clipOpacity, fadeColor }
   */
  getFadeColorState(progress) {
    const fadeColor = this.type === TRANSITION_TYPE.FADE_WHITE ? '#ffffff' : '#000000';
    
    // First half: fade to color, second half: fade from color
    let colorOpacity, clipOpacity;
    
    if (progress < 0.5) {
      // Fading to color
      colorOpacity = progress * 2;
      clipOpacity = 1 - colorOpacity;
    } else {
      // Fading from color
      colorOpacity = (1 - progress) * 2;
      clipOpacity = 1 - colorOpacity;
    }
    
    return { colorOpacity, clipOpacity, fadeColor };
  }

  /**
   * Get WebGL shader uniforms for this transition
   * @param {number} progress - Transition progress (0 to 1)
   * @returns {Object} - Shader uniforms
   */
  getShaderUniforms(progress) {
    const uniforms = {
      u_transitionType: this.getTypeIndex(),
      u_transitionProgress: progress,
    };
    
    switch (this.type) {
      case TRANSITION_TYPE.CROSSFADE: {
        const { fromOpacity, toOpacity } = this.getCrossfadeOpacities(progress);
        uniforms.u_fromOpacity = fromOpacity;
        uniforms.u_toOpacity = toOpacity;
        break;
      }
      case TRANSITION_TYPE.WIPE_LEFT:
      case TRANSITION_TYPE.WIPE_RIGHT:
      case TRANSITION_TYPE.WIPE_UP:
      case TRANSITION_TYPE.WIPE_DOWN: {
        const wipe = this.getWipePosition(progress);
        uniforms.u_wipePosition = wipe.clipX / 100;
        uniforms.u_wipeHorizontal = wipe.horizontal ? 1.0 : 0.0;
        uniforms.u_wipeReverse = wipe.reverse ? 1.0 : 0.0;
        break;
      }
      case TRANSITION_TYPE.FADE_BLACK:
      case TRANSITION_TYPE.FADE_WHITE: {
        const fade = this.getFadeColorState(progress);
        uniforms.u_fadeColor = this.type === TRANSITION_TYPE.FADE_WHITE ? 1.0 : 0.0;
        uniforms.u_fadeOpacity = fade.colorOpacity;
        break;
      }
      default:
        break;
    }
    
    return uniforms;
  }

  /**
   * Get numeric index for transition type (for shaders)
   * @returns {number}
   */
  getTypeIndex() {
    const types = Object.values(TRANSITION_TYPE);
    return types.indexOf(this.type);
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      duration: this.duration,
      easing: this.easing,
      fromClipId: this.fromClipId,
      toClipId: this.toClipId,
    };
  }

  /**
   * Create from JSON
   * @param {Object} data - JSON data
   * @returns {Transition}
   */
  static fromJSON(data) {
    return new Transition(data);
  }
}

export default Transition;
