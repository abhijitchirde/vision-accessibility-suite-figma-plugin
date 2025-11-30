/**
 * RadiusSlider Component
 *
 * Reusable slider for adjusting visual field defect radius
 * (e.g., central vision loss radius, tunnel vision radius)
 */

import React from 'react';
import './RadiusSlider.css';

export interface RadiusSliderProps {
  value: number; // Radius in pixels
  onChange: (radius: number) => void;
  label?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  showValue?: boolean;
}

export const RadiusSlider: React.FC<RadiusSliderProps> = ({
  value,
  onChange,
  label = 'Radius',
  min = 50,
  max = 300,
  disabled = false,
  showValue = true,
}) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  const handlePresetClick = (radius: number) => {
    onChange(radius);
  };

  // Preset radius values
  const presets = [
    { label: 'Small', value: Math.round(min + (max - min) * 0.25) },
    { label: 'Medium', value: Math.round(min + (max - min) * 0.5) },
    { label: 'Large', value: Math.round(min + (max - min) * 0.75) },
  ];

  return (
    <div className="radius-slider">
      <div className="radius-slider__header">
        <label className="radius-slider__label">
          {label}
          {showValue && <span className="radius-slider__value">{value}px</span>}
        </label>
      </div>

      <input
        type="range"
        className="radius-slider__input"
        min={min}
        max={max}
        step={10}
        value={value}
        onChange={handleSliderChange}
        disabled={disabled}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} pixels`}
      />

      <div className="radius-slider__presets">
        {presets.map((preset) => (
          <button
            key={preset.label}
            className={`radius-slider__preset ${
              value === preset.value ? 'radius-slider__preset--active' : ''
            }`}
            onClick={() => handlePresetClick(preset.value)}
            disabled={disabled}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};
