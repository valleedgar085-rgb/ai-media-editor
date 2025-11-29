/**
 * Waveform Generator - Generates waveform data from audio buffers
 * Uses Web Audio API for processing with optional Worker support
 */

import { WAVEFORM_SETTINGS } from './audioTypes';

/**
 * Generate waveform data from an AudioBuffer
 * @param {AudioBuffer} audioBuffer - Decoded audio buffer
 * @param {Object} options - Generation options
 * @returns {Float32Array} - Waveform peaks
 */
export const generateWaveformData = (audioBuffer, options = {}) => {
  const {
    samplesPerPixel = WAVEFORM_SETTINGS.samplesPerPixel,
    channel = 0,
  } = options;
  
  if (!audioBuffer) {
    return new Float32Array(0);
  }
  
  const channelData = audioBuffer.getChannelData(Math.min(channel, audioBuffer.numberOfChannels - 1));
  const length = channelData.length;
  const numPeaks = Math.ceil(length / samplesPerPixel);
  const peaks = new Float32Array(numPeaks * 2); // min and max for each segment
  
  for (let i = 0; i < numPeaks; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, length);
    
    let min = Infinity;
    let max = -Infinity;
    
    for (let j = start; j < end; j++) {
      const sample = channelData[j];
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }
    
    peaks[i * 2] = min === Infinity ? 0 : min;
    peaks[i * 2 + 1] = max === -Infinity ? 0 : max;
  }
  
  return peaks;
};

/**
 * Render waveform to a canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Float32Array} peaks - Waveform peaks data
 * @param {Object} options - Rendering options
 */
export const renderWaveform = (ctx, peaks, options = {}) => {
  const {
    width,
    height,
    color = WAVEFORM_SETTINGS.waveformColor,
    backgroundColor = WAVEFORM_SETTINGS.backgroundColor,
    startSample = 0,
    endSample = peaks.length / 2,
    offsetX = 0,
  } = options;
  
  // Clear canvas
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
  
  if (peaks.length === 0) return;
  
  const centerY = height / 2;
  const scale = height / 2;
  const numPeaks = peaks.length / 2;
  const visiblePeaks = endSample - startSample;
  const pixelsPerPeak = width / visiblePeaks;
  
  ctx.fillStyle = color;
  ctx.beginPath();
  
  // Draw waveform
  for (let i = 0; i < visiblePeaks; i++) {
    const peakIndex = Math.floor(startSample + i);
    if (peakIndex >= numPeaks) break;
    
    const min = peaks[peakIndex * 2];
    const max = peaks[peakIndex * 2 + 1];
    
    const x = offsetX + i * pixelsPerPeak;
    const minY = centerY - min * scale;
    const maxY = centerY - max * scale;
    
    // Draw bar from min to max
    ctx.fillRect(x, Math.min(minY, maxY), Math.max(1, pixelsPerPeak - 1), Math.abs(maxY - minY) || 1);
  }
};

/**
 * Waveform class for managing waveform generation and rendering
 */
class Waveform {
  constructor(audioBuffer = null, options = {}) {
    this.audioBuffer = audioBuffer;
    this.peaks = null;
    this.options = {
      ...WAVEFORM_SETTINGS,
      ...options,
    };
  }

  /**
   * Set the audio buffer and generate waveform
   * @param {AudioBuffer} buffer - Audio buffer
   */
  setAudioBuffer(buffer) {
    this.audioBuffer = buffer;
    this.peaks = generateWaveformData(buffer, {
      samplesPerPixel: this.options.samplesPerPixel,
    });
  }

  /**
   * Get waveform data
   * @returns {Float32Array}
   */
  getData() {
    return this.peaks;
  }

  /**
   * Render to canvas
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} options - Render options
   */
  render(canvas, options = {}) {
    if (!canvas || !this.peaks) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    renderWaveform(ctx, this.peaks, {
      width: canvas.width,
      height: canvas.height,
      color: this.options.waveformColor,
      backgroundColor: this.options.backgroundColor,
      ...options,
    });
  }

  /**
   * Get peaks for a time range
   * @param {number} startTime - Start time in seconds
   * @param {number} endTime - End time in seconds
   * @returns {Float32Array}
   */
  getPeaksForTimeRange(startTime, endTime) {
    if (!this.peaks || !this.audioBuffer) {
      return new Float32Array(0);
    }
    
    const duration = this.audioBuffer.duration;
    const numPeaks = this.peaks.length / 2;
    
    const startPeak = Math.floor((startTime / duration) * numPeaks);
    const endPeak = Math.ceil((endTime / duration) * numPeaks);
    
    const rangeStart = Math.max(0, startPeak) * 2;
    const rangeEnd = Math.min(numPeaks, endPeak) * 2;
    
    return this.peaks.slice(rangeStart, rangeEnd);
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.peaks = null;
    this.audioBuffer = null;
  }
}

export default Waveform;
