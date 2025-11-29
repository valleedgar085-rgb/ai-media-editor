import React from 'react';

function FilterControls({ filters, onFilterChange }) {
  const handleChange = (name, value) => {
    onFilterChange({ [name]: parseInt(value, 10) });
  };

  const handleReset = () => {
    onFilterChange({
      brightness: 100,
      contrast: 100,
      saturation: 100
    });
  };

  const filterConfigs = [
    { 
      name: 'brightness', 
      label: 'Brightness', 
      icon: '☀️',
      min: 0, 
      max: 200 
    },
    { 
      name: 'contrast', 
      label: 'Contrast', 
      icon: '◐',
      min: 0, 
      max: 200 
    },
    { 
      name: 'saturation', 
      label: 'Saturation', 
      icon: '🎨',
      min: 0, 
      max: 200 
    }
  ];

  const isDefault = filters.brightness === 100 && 
                   filters.contrast === 100 && 
                   filters.saturation === 100;

  return (
    <div className="filter-controls">
      <div className="filter-header">
        <h4>Filters</h4>
        <button 
          className="filter-reset-btn"
          onClick={handleReset}
          disabled={isDefault}
          title="Reset all filters"
        >
          Reset
        </button>
      </div>
      
      {filterConfigs.map(config => (
        <div key={config.name} className="filter-row">
          <label className="filter-label">
            <span className="filter-icon">{config.icon}</span>
            {config.label}
          </label>
          <input
            type="range"
            className="filter-slider"
            min={config.min}
            max={config.max}
            value={filters[config.name]}
            onChange={(e) => handleChange(config.name, e.target.value)}
          />
          <span className="filter-value">
            {filters[config.name]}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default FilterControls;
