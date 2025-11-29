import React, { useState, useCallback } from 'react';
import useEditorStore from '../../store/useEditorStore';
import { EXPORT_FORMATS, QUALITY_PRESETS, QUALITY_CONFIG, FORMAT_CONFIG } from '../../modules/export/exportTypes';

/**
 * Export Panel component - UI for configuring and starting exports
 */
function ExportPanel({ onClose }) {
  const { tracks, duration, filters, getProjectData } = useEditorStore();
  
  const [format, setFormat] = useState(EXPORT_FORMATS.MP4_H264);
  const [quality, setQuality] = useState(QUALITY_PRESETS.HIGH);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setProgress(0);
    setError(null);
    
    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }
      
      // Export completed
      setProgress(100);
      alert('Export completed! (Simulated - full implementation in progress)');
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [getProjectData]);

  const selectedQuality = QUALITY_CONFIG[quality];
  const selectedFormat = FORMAT_CONFIG[format];

  const hasContent = tracks.some(t => t.items.length > 0);

  return (
    <div className="export-panel">
      <div className="export-header">
        <h2>Export Video</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="export-content">
        {!hasContent ? (
          <div className="export-empty">
            <p>Add media to the timeline before exporting.</p>
          </div>
        ) : (
          <>
            {/* Format Selection */}
            <div className="export-section">
              <h3>Format</h3>
              <div className="export-options">
                {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
                  <label key={key} className={`export-option ${format === key ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value={key}
                      checked={format === key}
                      onChange={(e) => setFormat(e.target.value)}
                    />
                    <span className="option-label">{config.description}</span>
                    <span className="option-ext">.{config.extension}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Quality Selection */}
            <div className="export-section">
              <h3>Quality</h3>
              <div className="export-options">
                {Object.entries(QUALITY_CONFIG).map(([key, config]) => (
                  <label key={key} className={`export-option ${quality === key ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="quality"
                      value={key}
                      checked={quality === key}
                      onChange={(e) => setQuality(e.target.value)}
                    />
                    <span className="option-label">{config.description}</span>
                    <span className="option-detail">{config.width}×{config.height} @ {config.fps}fps</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Audio Option */}
            <div className="export-section">
              <h3>Audio</h3>
              <label className="export-checkbox">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                />
                <span>Include audio tracks</span>
              </label>
            </div>
            
            {/* Summary */}
            <div className="export-summary">
              <h3>Export Summary</h3>
              <div className="summary-details">
                <div className="summary-item">
                  <span className="summary-label">Duration:</span>
                  <span className="summary-value">{duration.toFixed(2)}s</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Resolution:</span>
                  <span className="summary-value">{selectedQuality?.width}×{selectedQuality?.height}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Format:</span>
                  <span className="summary-value">{selectedFormat?.extension.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            {/* Progress */}
            {isExporting && (
              <div className="export-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="progress-text">{progress}%</span>
              </div>
            )}
            
            {/* Error */}
            {error && (
              <div className="export-error">
                <p>Error: {error}</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="export-actions">
              <button 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isExporting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleExport}
                disabled={isExporting || !hasContent}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ExportPanel;
