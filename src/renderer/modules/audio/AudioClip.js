/**
 * Audio Clip Model - Represents an audio clip on the timeline
 */

import { AUDIO_STATE, DEFAULT_AUDIO_SETTINGS, FADE_TYPE } from './audioTypes';

/**
 * Generate unique ID for audio clip
 */
const generateId = () => `audio-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Audio Clip class representing a single audio clip
 */
class AudioClip {
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.name = options.name || 'Untitled Audio';
    this.path = options.path || null;
    this.type = 'audio';
    
    // Timeline position
    this.startTime = options.startTime || 0;
    this.duration = options.duration || 0;
    this.trimStart = options.trimStart || 0; // Trim from start
    this.trimEnd = options.trimEnd || 0; // Trim from end
    
    // Audio settings
    this.volume = options.volume ?? DEFAULT_AUDIO_SETTINGS.volume;
    this.pan = options.pan ?? DEFAULT_AUDIO_SETTINGS.pan;
    this.muted = options.muted ?? DEFAULT_AUDIO_SETTINGS.muted;
    this.solo = options.solo ?? DEFAULT_AUDIO_SETTINGS.solo;
    
    // Fade settings
    this.fadeIn = { ...DEFAULT_AUDIO_SETTINGS.fadeIn, ...(options.fadeIn || {}) };
    this.fadeOut = { ...DEFAULT_AUDIO_SETTINGS.fadeOut, ...(options.fadeOut || {}) };
    
    // Volume keyframes for automation
    this.volumeKeyframes = options.volumeKeyframes || [];
    
    // State and metadata
    this.state = AUDIO_STATE.LOADING;
    this.originalDuration = options.originalDuration || 0;
    this.sampleRate = options.sampleRate || 0;
    this.channels = options.channels || 0;
    this.waveformData = null;
    this.audioBuffer = null;
  }

  /**
   * Get the effective duration (after trimming)
   * @returns {number}
   */
  getEffectiveDuration() {
    return Math.max(0, this.originalDuration - this.trimStart - this.trimEnd);
  }

  /**
   * Get the end time on timeline
   * @returns {number}
   */
  getEndTime() {
    return this.startTime + this.duration;
  }

  /**
   * Get volume at a specific time (considering keyframes)
   * @param {number} time - Time relative to clip start
   * @returns {number}
   */
  getVolumeAtTime(time) {
    if (this.muted) return 0;
    
    // Apply fade in
    if (this.fadeIn.enabled && time < this.fadeIn.duration) {
      const fadeProgress = time / this.fadeIn.duration;
      const baseVolume = this.applyFadeCurve(fadeProgress, this.fadeIn.type);
      return baseVolume * this.getKeyframeVolumeAtTime(time);
    }
    
    // Apply fade out
    const timeFromEnd = this.duration - time;
    if (this.fadeOut.enabled && timeFromEnd < this.fadeOut.duration) {
      const fadeProgress = timeFromEnd / this.fadeOut.duration;
      const baseVolume = this.applyFadeCurve(fadeProgress, this.fadeOut.type);
      return baseVolume * this.getKeyframeVolumeAtTime(time);
    }
    
    return this.getKeyframeVolumeAtTime(time);
  }

  /**
   * Apply fade curve
   * @param {number} progress - Fade progress (0 to 1)
   * @param {string} type - Fade type
   * @returns {number}
   */
  applyFadeCurve(progress, type) {
    switch (type) {
      case FADE_TYPE.EXPONENTIAL:
        return Math.pow(progress, 2);
      case FADE_TYPE.LOGARITHMIC:
        return Math.log10(1 + progress * 9);
      case FADE_TYPE.LINEAR:
      default:
        return progress;
    }
  }

  /**
   * Get volume from keyframes at a specific time
   * @param {number} time - Time relative to clip start
   * @returns {number}
   */
  getKeyframeVolumeAtTime(time) {
    if (this.volumeKeyframes.length === 0) {
      return this.volume;
    }
    
    // Sort keyframes by time
    const sorted = [...this.volumeKeyframes].sort((a, b) => a.time - b.time);
    
    // Find surrounding keyframes
    let before = null;
    let after = null;
    
    for (const kf of sorted) {
      if (kf.time <= time) {
        before = kf;
      } else {
        after = kf;
        break;
      }
    }
    
    // No keyframes before - use first keyframe value or base volume
    if (!before) {
      return after ? after.value : this.volume;
    }
    
    // No keyframes after - use last keyframe value
    if (!after) {
      return before.value;
    }
    
    // Interpolate between keyframes
    const progress = (time - before.time) / (after.time - before.time);
    return this.interpolate(before.value, after.value, progress, before.easing);
  }

  /**
   * Interpolate between two values
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} progress - Progress (0 to 1)
   * @param {string} easing - Easing function
   * @returns {number}
   */
  interpolate(start, end, progress, easing = 'linear') {
    let t = progress;
    
    switch (easing) {
      case 'ease-in':
        t = progress * progress;
        break;
      case 'ease-out':
        t = 1 - Math.pow(1 - progress, 2);
        break;
      case 'ease-in-out':
        t = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        break;
      case 'linear':
      default:
        t = progress;
    }
    
    return start + (end - start) * t;
  }

  /**
   * Add a volume keyframe
   * @param {number} time - Time relative to clip start
   * @param {number} value - Volume value (0 to 1)
   * @param {string} easing - Easing function
   */
  addVolumeKeyframe(time, value, easing = 'linear') {
    // Remove existing keyframe at same time
    this.volumeKeyframes = this.volumeKeyframes.filter(kf => Math.abs(kf.time - time) > 0.01);
    
    this.volumeKeyframes.push({
      id: generateId(),
      time,
      value: Math.max(0, Math.min(1, value)),
      easing,
    });
    
    // Sort by time
    this.volumeKeyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Remove a volume keyframe
   * @param {string} keyframeId - Keyframe ID
   */
  removeVolumeKeyframe(keyframeId) {
    this.volumeKeyframes = this.volumeKeyframes.filter(kf => kf.id !== keyframeId);
  }

  /**
   * Set fade in settings
   * @param {Object} settings - Fade settings
   */
  setFadeIn(settings) {
    this.fadeIn = { ...this.fadeIn, ...settings };
  }

  /**
   * Set fade out settings
   * @param {Object} settings - Fade settings
   */
  setFadeOut(settings) {
    this.fadeOut = { ...this.fadeOut, ...settings };
  }

  /**
   * Trim the clip
   * @param {number} trimStart - Trim from start in seconds
   * @param {number} trimEnd - Trim from end in seconds
   */
  setTrim(trimStart, trimEnd) {
    this.trimStart = Math.max(0, trimStart);
    this.trimEnd = Math.max(0, trimEnd);
    this.duration = this.getEffectiveDuration();
  }

  /**
   * Split the clip at a given time
   * @param {number} splitTime - Time relative to clip start
   * @returns {AudioClip|null} - New clip after split point, or null if split is invalid
   */
  split(splitTime) {
    if (splitTime <= 0 || splitTime >= this.duration) {
      return null;
    }
    
    // Create new clip for the second half
    const newClip = new AudioClip({
      name: `${this.name} (split)`,
      path: this.path,
      startTime: this.startTime + splitTime,
      duration: this.duration - splitTime,
      trimStart: this.trimStart + splitTime,
      trimEnd: this.trimEnd,
      volume: this.volume,
      pan: this.pan,
      muted: this.muted,
      originalDuration: this.originalDuration,
      sampleRate: this.sampleRate,
      channels: this.channels,
    });
    
    // Update this clip
    this.duration = splitTime;
    this.trimEnd = this.originalDuration - this.trimStart - splitTime;
    
    // Distribute keyframes
    const splitKeyframes = this.volumeKeyframes.filter(kf => kf.time >= splitTime);
    newClip.volumeKeyframes = splitKeyframes.map(kf => ({
      ...kf,
      time: kf.time - splitTime,
    }));
    
    this.volumeKeyframes = this.volumeKeyframes.filter(kf => kf.time < splitTime);
    
    return newClip;
  }

  /**
   * Mark the clip as ready
   * @param {AudioBuffer} buffer - Decoded audio buffer
   */
  setReady(buffer) {
    this.audioBuffer = buffer;
    this.state = AUDIO_STATE.READY;
    this.originalDuration = buffer.duration;
    this.sampleRate = buffer.sampleRate;
    this.channels = buffer.numberOfChannels;
    
    if (this.duration === 0) {
      this.duration = buffer.duration;
    }
  }

  /**
   * Mark the clip as errored
   * @param {Error|string} error - Error object or message
   */
  setError(error) {
    this.state = AUDIO_STATE.ERROR;
    this.error = error instanceof Error ? error.message : error;
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      type: this.type,
      startTime: this.startTime,
      duration: this.duration,
      trimStart: this.trimStart,
      trimEnd: this.trimEnd,
      volume: this.volume,
      pan: this.pan,
      muted: this.muted,
      solo: this.solo,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      volumeKeyframes: this.volumeKeyframes,
      originalDuration: this.originalDuration,
      sampleRate: this.sampleRate,
      channels: this.channels,
    };
  }

  /**
   * Create from JSON
   * @param {Object} data - JSON data
   * @returns {AudioClip}
   */
  static fromJSON(data) {
    return new AudioClip(data);
  }
}

export default AudioClip;
