/**
 * Export Pipeline - Handles video/audio export to MP4/WebM
 * Uses MediaRecorder for client-side encoding with fallback to server
 */

import ExportJob from './ExportJob';
import { EXPORT_STATUS, FORMAT_CONFIG, EXPORT_FORMATS } from './exportTypes';

/**
 * Check if MediaRecorder supports a MIME type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean}
 */
const isMediaRecorderSupported = (mimeType) => {
  if (typeof MediaRecorder === 'undefined') {
    return false;
  }
  return MediaRecorder.isTypeSupported(mimeType);
};

/**
 * Get the best supported codec for a format
 * @param {string} format - Export format
 * @returns {string|null}
 */
const getBestCodec = (format) => {
  const config = FORMAT_CONFIG[format];
  if (!config) return null;
  
  // Try different codec profiles
  const codecOptions = format === EXPORT_FORMATS.MP4_H264 
    ? [
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        'video/mp4; codecs="avc1.4D401E, mp4a.40.2"',
        'video/mp4; codecs="avc1.64001E, mp4a.40.2"',
        'video/mp4',
      ]
    : [
        'video/webm; codecs="vp9, opus"',
        'video/webm; codecs="vp8, opus"',
        'video/webm; codecs="vp9, vorbis"',
        'video/webm; codecs="vp8, vorbis"',
        'video/webm',
      ];
  
  for (const codec of codecOptions) {
    if (isMediaRecorderSupported(codec)) {
      return codec;
    }
  }
  
  return null;
};

/**
 * Export Pipeline class for handling video export
 */
class ExportPipeline {
  constructor() {
    this.jobs = new Map();
    this.serverEndpoint = null;
    this.listeners = new Set();
  }

  /**
   * Configure server-side export endpoint
   * @param {string} endpoint - Server API endpoint
   */
  setServerEndpoint(endpoint) {
    this.serverEndpoint = endpoint;
  }

  /**
   * Add a listener for job updates
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of job update
   * @param {ExportJob} job - Updated job
   */
  notifyListeners(job) {
    this.listeners.forEach(listener => listener(job.getSummary()));
  }

  /**
   * Create a new export job
   * @param {Object} project - Project data (tracks, duration, etc.)
   * @param {Object} settings - Export settings
   * @returns {ExportJob}
   */
  createJob(project, settings = {}) {
    const job = new ExportJob(project, settings);
    this.jobs.set(job.id, job);
    this.notifyListeners(job);
    return job;
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {ExportJob|null}
   */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   * @returns {Array<Object>}
   */
  getAllJobs() {
    return Array.from(this.jobs.values()).map(job => job.getSummary());
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job ID
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.cancel();
      this.notifyListeners(job);
    }
  }

  /**
   * Start client-side export using Canvas and MediaRecorder
   * @param {ExportJob} job - Export job
   * @param {HTMLCanvasElement} canvas - Render canvas
   * @param {AudioContext} audioContext - Audio context for mixing
   * @returns {Promise<string>}
   */
  async exportClientSide(job, canvas, audioContext) {
    const { settings } = job;
    const mimeType = getBestCodec(settings.format);
    
    if (!mimeType) {
      throw new Error('No supported codec found for client-side export');
    }
    
    job.setStatus(EXPORT_STATUS.PREPARING);
    job.log(`Using codec: ${mimeType}`);
    this.notifyListeners(job);
    
    // Create canvas capture stream
    const fps = settings.fps || 30;
    const canvasStream = canvas.captureStream(fps);
    
    // Mix audio if needed
    let combinedStream = canvasStream;
    if (settings.includeAudio && audioContext) {
      job.log('Mixing audio tracks');
      // Audio mixing would happen here in a full implementation
      // For now, just use the canvas stream
    }
    
    // Set up MediaRecorder
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: settings.videoBitrate,
      audioBitsPerSecond: settings.audioBitrate,
    });
    
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      job.abortController = new AbortController();
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onerror = (e) => {
        reject(new Error(`MediaRecorder error: ${e.error?.message || 'Unknown error'}`));
      };
      
      mediaRecorder.onstop = () => {
        if (job.status === EXPORT_STATUS.CANCELLED) {
          reject(new Error('Export cancelled'));
          return;
        }
        
        job.setStatus(EXPORT_STATUS.FINALIZING);
        job.log('Creating output file');
        this.notifyListeners(job);
        
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };
      
      job.abortController.signal.addEventListener('abort', () => {
        mediaRecorder.stop();
      });
      
      job.setStatus(EXPORT_STATUS.ENCODING);
      job.log('Starting encoding');
      this.notifyListeners(job);
      
      mediaRecorder.start(1000); // Collect data every second
    });
  }

  /**
   * Start server-side export (fallback for large projects)
   * @param {ExportJob} job - Export job
   * @returns {Promise<string>}
   */
  async exportServerSide(job) {
    if (!this.serverEndpoint) {
      throw new Error('Server endpoint not configured');
    }
    
    job.setStatus(EXPORT_STATUS.PREPARING);
    job.log('Preparing server-side export');
    this.notifyListeners(job);
    
    try {
      const response = await fetch(this.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: job.project,
          settings: job.settings,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Poll for completion
      job.setStatus(EXPORT_STATUS.ENCODING);
      this.notifyListeners(job);
      
      // Server would return a job ID and we'd poll for status
      // For demo, just return the response URL
      return data.outputUrl || data.url;
    } catch (error) {
      throw new Error(`Server export failed: ${error.message}`);
    }
  }

  /**
   * Start export with automatic fallback
   * @param {ExportJob} job - Export job
   * @param {Object} options - Export options
   * @returns {Promise<string>}
   */
  async startExport(job, options = {}) {
    const { canvas, audioContext, preferServer = false } = options;
    
    try {
      let outputUrl;
      
      // Check if client-side export is supported
      const mimeType = getBestCodec(job.settings.format);
      const canExportClientSide = mimeType && canvas;
      
      if (preferServer && this.serverEndpoint) {
        outputUrl = await this.exportServerSide(job);
      } else if (canExportClientSide) {
        outputUrl = await this.exportClientSide(job, canvas, audioContext);
      } else if (this.serverEndpoint) {
        job.log('Falling back to server-side export', 'warn');
        outputUrl = await this.exportServerSide(job);
      } else {
        throw new Error('No export method available');
      }
      
      job.complete(outputUrl);
      this.notifyListeners(job);
      return outputUrl;
    } catch (error) {
      job.fail(error);
      this.notifyListeners(job);
      throw error;
    }
  }

  /**
   * Clean up completed/failed jobs older than given age
   * @param {number} maxAge - Max age in milliseconds
   */
  cleanupJobs(maxAge = 3600000) {
    const now = Date.now();
    
    for (const [jobId, job] of this.jobs) {
      if (job.completedAt && (now - job.completedAt) > maxAge) {
        // Clean up blob URLs
        if (job.outputUrl && job.outputUrl.startsWith('blob:')) {
          URL.revokeObjectURL(job.outputUrl);
        }
        this.jobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
const exportPipeline = new ExportPipeline();

export default exportPipeline;
export { ExportPipeline, isMediaRecorderSupported, getBestCodec };
