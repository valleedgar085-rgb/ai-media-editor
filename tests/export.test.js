/**
 * Tests for Export module
 */

import ExportJob from '../src/renderer/modules/export/ExportJob';
import { 
  EXPORT_STATUS, 
  EXPORT_FORMATS, 
  QUALITY_PRESETS,
  DEFAULT_EXPORT_SETTINGS,
} from '../src/renderer/modules/export/exportTypes';

describe('ExportJob', () => {
  describe('initialization', () => {
    test('should create with default settings', () => {
      const job = new ExportJob({});
      
      expect(job.id).toBeDefined();
      expect(job.status).toBe(EXPORT_STATUS.QUEUED);
      expect(job.progress).toBe(0);
      expect(job.settings.format).toBe(EXPORT_FORMATS.MP4_H264);
      expect(job.settings.quality).toBe(QUALITY_PRESETS.HIGH);
    });
    
    test('should create with custom settings', () => {
      const job = new ExportJob({}, {
        format: EXPORT_FORMATS.WEBM_VP9,
        quality: QUALITY_PRESETS.MEDIUM,
        width: 1280,
        height: 720,
      });
      
      expect(job.settings.format).toBe(EXPORT_FORMATS.WEBM_VP9);
      expect(job.settings.quality).toBe(QUALITY_PRESETS.MEDIUM);
      expect(job.settings.width).toBe(1280);
      expect(job.settings.height).toBe(720);
    });
  });
  
  describe('progress tracking', () => {
    test('should update progress', () => {
      const job = new ExportJob({});
      
      job.updateProgress(50, 'Encoding');
      
      expect(job.progress).toBe(50);
      expect(job.currentPhase).toBe('Encoding');
    });
    
    test('should clamp progress to 0-100', () => {
      const job = new ExportJob({});
      
      job.updateProgress(-10);
      expect(job.progress).toBe(0);
      
      job.updateProgress(150);
      expect(job.progress).toBe(100);
    });
  });
  
  describe('status management', () => {
    test('should update status', () => {
      const job = new ExportJob({});
      
      job.setStatus(EXPORT_STATUS.ENCODING);
      expect(job.status).toBe(EXPORT_STATUS.ENCODING);
      expect(job.startedAt).toBeDefined();
    });
    
    test('should set completedAt on completion', () => {
      const job = new ExportJob({});
      
      job.setStatus(EXPORT_STATUS.COMPLETED);
      expect(job.completedAt).toBeDefined();
    });
    
    test('should set completedAt on failure', () => {
      const job = new ExportJob({});
      
      job.setStatus(EXPORT_STATUS.FAILED);
      expect(job.completedAt).toBeDefined();
    });
    
    test('should set completedAt on cancel', () => {
      const job = new ExportJob({});
      
      job.setStatus(EXPORT_STATUS.CANCELLED);
      expect(job.completedAt).toBeDefined();
    });
  });
  
  describe('ETA calculation', () => {
    test('should return null when not started', () => {
      const job = new ExportJob({});
      expect(job.getETA()).toBeNull();
    });
    
    test('should return null when progress is 0', () => {
      const job = new ExportJob({});
      job.setStatus(EXPORT_STATUS.ENCODING);
      job.progress = 0;
      
      expect(job.getETA()).toBeNull();
    });
    
    test('should return null when completed', () => {
      const job = new ExportJob({});
      job.progress = 100;
      
      expect(job.getETA()).toBeNull();
    });
  });
  
  describe('job completion', () => {
    test('should complete with output URL', () => {
      const job = new ExportJob({});
      
      job.complete('blob:http://example.com/video.mp4');
      
      expect(job.status).toBe(EXPORT_STATUS.COMPLETED);
      expect(job.progress).toBe(100);
      expect(job.outputUrl).toBe('blob:http://example.com/video.mp4');
    });
    
    test('should fail with error message', () => {
      const job = new ExportJob({});
      
      job.fail(new Error('Encoding failed'));
      
      expect(job.status).toBe(EXPORT_STATUS.FAILED);
      expect(job.error).toBe('Encoding failed');
    });
    
    test('should fail with string error', () => {
      const job = new ExportJob({});
      
      job.fail('Something went wrong');
      
      expect(job.status).toBe(EXPORT_STATUS.FAILED);
      expect(job.error).toBe('Something went wrong');
    });
    
    test('should cancel', () => {
      const job = new ExportJob({});
      
      job.cancel();
      
      expect(job.status).toBe(EXPORT_STATUS.CANCELLED);
    });
  });
  
  describe('logging', () => {
    test('should log messages', () => {
      const job = new ExportJob({});
      
      job.log('Test message', 'info');
      job.log('Warning message', 'warn');
      job.log('Error message', 'error');
      
      expect(job.logs).toHaveLength(3);
      expect(job.logs[0].message).toBe('Test message');
      expect(job.logs[0].level).toBe('info');
      expect(job.logs[1].level).toBe('warn');
      expect(job.logs[2].level).toBe('error');
    });
  });
  
  describe('summary', () => {
    test('should get job summary', () => {
      const job = new ExportJob({}, { width: 1920, height: 1080 });
      job.updateProgress(50, 'Encoding frames');
      
      const summary = job.getSummary();
      
      expect(summary.id).toBe(job.id);
      expect(summary.status).toBe(EXPORT_STATUS.QUEUED);
      expect(summary.progress).toBe(50);
      expect(summary.currentPhase).toBe('Encoding frames');
      expect(summary.settings.width).toBe(1920);
      expect(summary.settings.height).toBe(1080);
    });
  });
});

describe('Export Types', () => {
  test('should have MP4 and WebM formats', () => {
    expect(EXPORT_FORMATS.MP4_H264).toBeDefined();
    expect(EXPORT_FORMATS.WEBM_VP9).toBeDefined();
  });
  
  test('should have quality presets', () => {
    expect(QUALITY_PRESETS.LOW).toBeDefined();
    expect(QUALITY_PRESETS.MEDIUM).toBeDefined();
    expect(QUALITY_PRESETS.HIGH).toBeDefined();
  });
  
  test('should have default export settings', () => {
    expect(DEFAULT_EXPORT_SETTINGS.format).toBeDefined();
    expect(DEFAULT_EXPORT_SETTINGS.width).toBe(1920);
    expect(DEFAULT_EXPORT_SETTINGS.height).toBe(1080);
    expect(DEFAULT_EXPORT_SETTINGS.fps).toBe(30);
  });
});
