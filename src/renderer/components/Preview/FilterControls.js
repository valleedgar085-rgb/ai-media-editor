import React, { useCallback } from 'react';
import useEditorStore from '../../store/useEditorStore';

/**
 * FilterControls component - UI controls for brightness, contrast, saturation
 */
function FilterControls() {
  const { filters, setFilter, resetFilters } = useEditorStore();
  
  const handleFilterChange = useCallback((filterName, value) => {
    setFilter(filterName, parseInt(value, 10));
  }, [setFilter]);
  
  const filterConfigs = [
    {
      name: 'brightness',
      label: 'Brightness',
      icon: '☀️',
      value: filters.brightness,
    },
    {
      name: 'contrast',
      label: 'Contrast',
      icon: '◐',
      value: filters.contrast,
    },
    {
      name: 'saturation',
      label: 'Saturation',
      icon: '🎨',
      value: filters.saturation,
    },
  ];
  
  const hasChanges = filters.brightness !== 0 || filters.contrast !== 0 || filters.saturation !== 0;
  
  return (
    <div className="filter-controls-panel">
      <div className="filter-header">
        <h4>Filters</h4>
        {hasChanges && (
          <button className="reset-btn" onClick={resetFilters} title="Reset all filters">
            Reset
          </button>
        )}
      </div>
      
      <div className="filter-sliders">
        {filterConfigs.map((filter) => (
          <div key={filter.name} className="filter-slider-group">
            <div className="filter-label">
              <span className="filter-icon">{filter.icon}</span>
              <span className="filter-name">{filter.label}</span>
              <span className="filter-value">{filter.value}</span>
            </div>
            <input
              type="range"
              className="filter-slider"
              min={-100}
              max={100}
              value={filter.value}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            />
            <div className="slider-ticks">
              <span>-100</span>
              <span>0</span>
              <span>+100</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick presets */}
      <div className="filter-presets">
        <span className="preset-label">Presets:</span>
        <button
          className="preset-btn"
          onClick={() => {
            setFilter('brightness', 15);
            setFilter('contrast', 10);
            setFilter('saturation', 20);
          }}
          title="Vivid"
        >
          Vivid
        </button>
        <button
          className="preset-btn"
          onClick={() => {
            setFilter('brightness', -10);
            setFilter('contrast', 20);
            setFilter('saturation', -30);
          }}
          title="Dramatic"
        >
          Dramatic
        </button>
        <button
          className="preset-btn"
          onClick={() => {
            setFilter('brightness', 5);
            setFilter('contrast', -5);
            setFilter('saturation', -100);
          }}
          title="B&W"
        >
          B&W
        </button>
        <button
          className="preset-btn"
          onClick={() => {
            setFilter('brightness', 10);
            setFilter('contrast', -10);
            setFilter('saturation', -20);
          }}
          title="Vintage"
        >
          Vintage
        </button>
      </div>
    </div>
  );
}

export default FilterControls;
