/**
 * Export Job class for managing export operations
 */

import { EXPORT_STATUS, DEFAULT_EXPORT_SETTINGS } from './exportTypes';

/**
 * Generate unique job ID
 */
const generateJobId = () => `export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Export Job class representing a single export operation
 */
class ExportJob {
  constructor(project, settings = {}) {
    this.id = generateJobId();
    this.project = project;
    this.settings = { ...DEFAULT_EXPORT_SETTINGS, ...settings };
    this.status = EXPORT_STATUS.QUEUED;
    this.progress = 0;
    this.currentPhase = '';
    this.startedAt = null;
    this.completedAt = null;
    this.error = null;
    this.outputUrl = null;
    this.logs = [];
    this.abortController = null;
  }

  /**
   * Log a message
   * @param {string} message - Log message
   * @param {string} level - Log level (info, warn, error)
   */
  log(message, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    this.logs.push(logEntry);
    console.log(`[Export ${this.id}] [${level}] ${message}`);
  }

  /**
   * Update job progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} phase - Current phase description
   */
  updateProgress(progress, phase = '') {
    this.progress = Math.min(100, Math.max(0, progress));
    if (phase) {
      this.currentPhase = phase;
    }
  }

  /**
   * Update job status
   * @param {string} status - New status from EXPORT_STATUS
   */
  setStatus(status) {
    this.status = status;
    
    if (status === EXPORT_STATUS.ENCODING && !this.startedAt) {
      this.startedAt = Date.now();
    }
    
    if (status === EXPORT_STATUS.COMPLETED || 
        status === EXPORT_STATUS.FAILED || 
        status === EXPORT_STATUS.CANCELLED) {
      this.completedAt = Date.now();
    }
  }

  /**
   * Get estimated time remaining in seconds
   * @returns {number|null}
   */
  getETA() {
    if (!this.startedAt || this.progress <= 0 || this.progress >= 100) {
      return null;
    }
    
    const elapsed = (Date.now() - this.startedAt) / 1000;
    const estimatedTotal = elapsed / (this.progress / 100);
    return Math.max(0, estimatedTotal - elapsed);
  }

  /**
   * Cancel the export job
   */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.setStatus(EXPORT_STATUS.CANCELLED);
    this.log('Export cancelled by user', 'warn');
  }

  /**
   * Mark job as failed
   * @param {Error|string} error - Error object or message
   */
  fail(error) {
    this.error = error instanceof Error ? error.message : error;
    this.setStatus(EXPORT_STATUS.FAILED);
    this.log(`Export failed: ${this.error}`, 'error');
  }

  /**
   * Mark job as completed
   * @param {string} outputUrl - URL to the exported file
   */
  complete(outputUrl) {
    this.outputUrl = outputUrl;
    this.progress = 100;
    this.setStatus(EXPORT_STATUS.COMPLETED);
    this.log('Export completed successfully');
  }

  /**
   * Get job summary
   * @returns {Object}
   */
  getSummary() {
    return {
      id: this.id,
      status: this.status,
      progress: this.progress,
      currentPhase: this.currentPhase,
      eta: this.getETA(),
      error: this.error,
      outputUrl: this.outputUrl,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      settings: this.settings,
    };
  }
}

export default ExportJob;
